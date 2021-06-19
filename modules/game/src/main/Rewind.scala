package lila.game

import org.joda.time.DateTime
import scalaz.Validation.FlatMap._

import shogi.format.{ FEN, kif => shogiKif }

object Rewind {

  private def createTags(fen: Option[FEN], game: Game) = {
    val variantTag = Some(shogiKif.Tag(_.Variant, game.variant.name))
    val fenTag     = fen map (f => shogiKif.Tag(_.FEN, f.value))

    shogiKif.Tags(List(variantTag, fenTag).flatten)
  }

  def apply(game: Game, initialFen: Option[FEN]): Valid[Progress] =
    shogiKif.Reader
      .movesWithSans(
        moveStrs = game.kifMoves,
        op = sans => shogiKif.Sans(sans.value.dropRight(1)),
        tags = createTags(initialFen, game)
      )
      .flatMap(_.valid) map { replay =>
      val rewindedGame = replay.state
      val color        = game.turnColor
      val prevTurn     = game.shogi.moveNumber - 1
      val refundPeriod = (game.clockHistory map (_.turnIsPresent(color, prevTurn))).getOrElse(false)
      val newClock = game.clock.map(_.takeback(refundPeriod)) map { clk =>
        game.clockHistory.flatMap(_.last(color)).fold(clk) { t =>
          {
            val backInTime = {
              if (clk.isUsingByoyomi(color)) clk.byoyomi
              else t
            }
            clk.setRemainingTime(color, backInTime)
          }
        }
      }
      def rewindPlayer(player: Player) = player.copy(proposeTakebackAt = 0)
      val newGame = game.copy(
        sentePlayer = rewindPlayer(game.sentePlayer),
        gotePlayer = rewindPlayer(game.gotePlayer),
        shogi = rewindedGame.copy(clock = newClock),
        binaryMoveTimes = game.binaryMoveTimes.map { binary =>
          val moveTimes = BinaryFormat.moveTime.read(binary, game.playedTurns)
          BinaryFormat.moveTime.write(moveTimes.dropRight(1))
        },
        loadClockHistory = _ =>
          game.clockHistory.map { ch =>
            (ch.update(!color, _.dropRight(1))).dropTurn(!color, prevTurn)
          },
        movedAt = DateTime.now
      )
      Progress(game, newGame)
    }
}
