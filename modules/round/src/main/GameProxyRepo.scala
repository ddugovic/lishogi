package lila.round

import lila.game.Game
import lila.game.PlayerRef
import lila.game.Pov
import lila.socket.Socket.SocketVersion

final class GameProxyRepo(
    gameRepo: lila.game.GameRepo,
    roundSocket: RoundSocket,
)(implicit ec: scala.concurrent.ExecutionContext) {

  def gameWithVersion(gameId: Game.ID): Fu[Option[(Game, SocketVersion)]] =
    Game.validId(gameId) ?? roundSocket.getGameWithVersion(gameId)
  def game(gameId: Game.ID): Fu[Option[Game]] = Game.validId(gameId) ?? roundSocket.getGame(gameId)

  def povWithVersion(gameId: Game.ID, user: lila.user.User): Fu[Option[(Pov, SocketVersion)]] =
    gameWithVersion(gameId) dmap { _ flatMap { case (g, v) => Pov(g, user).map(p => (p, v)) } }
  def pov(gameId: Game.ID, user: lila.user.User): Fu[Option[Pov]] =
    povWithVersion(gameId, user) dmap2 { _._1 }

  def povWithVersion(gameId: Game.ID, color: shogi.Color): Fu[Option[(Pov, SocketVersion)]] =
    gameWithVersion(gameId) dmap2 { case (g, v) => (Pov(g, color), v) }
  def pov(gameId: Game.ID, color: shogi.Color): Fu[Option[Pov]] =
    povWithVersion(gameId, color) dmap2 { _._1 }

  def povWithVersion(fullId: Game.ID): Fu[Option[(Pov, SocketVersion)]] =
    povWithVersion(PlayerRef(fullId))
  def pov(fullId: Game.ID): Fu[Option[Pov]] =
    povWithVersion(fullId) dmap2 { _._1 }

  def povWithVersion(playerRef: PlayerRef): Fu[Option[(Pov, SocketVersion)]] =
    gameWithVersion(playerRef.gameId) dmap {
      _ flatMap { case (g, v) => g.playerIdPov(playerRef.playerId).map(p => (p, v)) }
    }
  def pov(playerRef: PlayerRef): Fu[Option[Pov]] =
    povWithVersion(playerRef) dmap2 { _._1 }

  def gameIfPresent(gameId: Game.ID): Fu[Option[Game]] = roundSocket gameIfPresent gameId

  // get the proxied version of the game
  def upgradeIfPresent(game: Game): Fu[Game] =
    if (game.finishedOrAborted) fuccess(game)
    else roundSocket upgradeIfPresent game

  def upgradeIfPresent(pov: Pov): Fu[Pov] =
    upgradeIfPresent(pov.game).dmap(_ pov pov.color)

  // update the proxied game
  def updateIfPresent = roundSocket.updateIfPresent _

  def povIfPresent(gameId: Game.ID, color: shogi.Color): Fu[Option[Pov]] =
    gameIfPresent(gameId) dmap2 { Pov(_, color) }

  def povIfPresent(fullId: Game.ID): Fu[Option[Pov]] = povIfPresent(PlayerRef(fullId))

  def povIfPresent(playerRef: PlayerRef): Fu[Option[Pov]] =
    gameIfPresent(playerRef.gameId) dmap { _ flatMap { _ playerIdPov playerRef.playerId } }

  def urgentGames(user: lila.user.User): Fu[List[Pov]] =
    gameRepo urgentPovsUnsorted user flatMap {
      _.map { pov =>
        gameIfPresent(pov.gameId) dmap { _.fold(pov)(pov.withGame) }
      }.sequenceFu map { povs =>
        try {
          povs sortWith Pov.priority
        } catch { case _: IllegalArgumentException => povs sortBy (-_.game.movedAt.getSeconds) }
      }
    }
}
