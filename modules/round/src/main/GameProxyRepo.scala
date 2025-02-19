package lila.round

import lila.game.Game
import lila.game.PlayerRef
import lila.game.Pov

final class GameProxyRepo(
    gameRepo: lila.game.GameRepo,
    roundSocket: RoundSocket,
)(implicit ec: scala.concurrent.ExecutionContext) {

  def game(gameId: Game.ID): Fu[Option[Game]] = Game.validId(gameId) ?? roundSocket.getGame(gameId)

  def pov(gameId: Game.ID, user: lila.user.User): Fu[Option[Pov]] =
    game(gameId) dmap { _ flatMap { Pov(_, user) } }

  def pov(gameId: Game.ID, color: shogi.Color): Fu[Option[Pov]] =
    game(gameId) dmap2 { Pov(_, color) }

  def pov(fullId: Game.ID): Fu[Option[Pov]] = {
    pov(PlayerRef(fullId))
  }

  def pov(playerRef: PlayerRef): Fu[Option[Pov]] = {
    game(playerRef.gameId) dmap { _ flatMap { _ playerIdPov playerRef.playerId } }
  }

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
