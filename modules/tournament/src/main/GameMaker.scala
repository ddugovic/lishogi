package lila.tournament

import shogi.Color
import shogi.Gote
import shogi.Sente

import lila.game.Game
import lila.game.GameRepo
import lila.game.Source
import lila.game.{ Player => GamePlayer }
import lila.user.User

final class GameMaker(
    gameRepo: GameRepo,
    duelStore: DuelStore,
    lightUserApi: lila.user.LightUserApi,
    onStart: Game.ID => Unit,
)(implicit ec: scala.concurrent.ExecutionContext) {

  def autoPairing(
      tour: Tournament,
      pairing: Pairing,
      playersMap: Map[User.ID, Player],
      ranking: Ranking,
  ): Fu[Game] = {
    val player1 = playersMap get pairing.user1 err s"Missing pairing player1 $pairing"
    val player2 = playersMap get pairing.user2 err s"Missing pairing player2 $pairing"
    val clock   = tour.timeControl.clock.map(_.toClock)
    val game = Game
      .make(
        shogi = shogi
          .Game(
            tour.position,
            tour.variant,
          )
          .copy(clock = clock),
        daysPerTurn = tour.timeControl.days,
        initialSfen = tour.position,
        sentePlayer = makePlayer(Sente, player1),
        gotePlayer = makePlayer(Gote, player2),
        mode = tour.mode,
        proMode = tour.proMode,
        source = Source.Tournament,
        notationImport = None,
      )
      .withId(pairing.gameId)
      .withTournamentId(tour.id)
      .start
    (gameRepo insertDenormalized game) >>- {
      onStart(game.id)
      duelStore.add(
        tour = tour,
        game = game,
        p1 = (usernameOf(pairing.user1) -> ~game.sentePlayer.stableRating),
        p2 = (usernameOf(pairing.user2) -> ~game.gotePlayer.stableRating),
        ranking = ranking,
      )
    } inject game
  }

  private def makePlayer(color: Color, player: Player) =
    GamePlayer.make(
      color,
      player.userId,
      player.rating,
      provisional = player.provisional,
      isBot = false,
      hasTitle = false,
    )

  private def usernameOf(userId: User.ID) =
    lightUserApi.sync(userId).fold(userId)(_.name)
}
