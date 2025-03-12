package lila.app
package templating

import shogi.Color
import shogi.Hand
import shogi.Pos
import shogi.Situation
import shogi.variant.Variant

import lila.api.Context
import lila.app.ui.ScalatagsTemplate._
import lila.game.Pov

trait ShogigroundHelper {

  def shogiground(sit: Situation, orient: Color, @scala.annotation.unused lastUsi: List[Pos] = Nil)(
      implicit ctx: Context,
  ): Frag =
    sgWrap(sit.variant, orient) {
      frag(
        shogigroundHand(
          Top,
          sit.variant,
          !orient,
          sit.hands(!orient),
        ),
        sgBoard(
          sgSquares,
          sgPieces {
            raw {
              val scale = 50
              def x(p: Pos) =
                orient.fold(sit.variant.numberOfFiles - p.file.index - 1, p.file.index) * scale
              def y(p: Pos) =
                orient.fold(p.rank.index, sit.variant.numberOfRanks - p.rank.index - 1) * scale
              if (ctx.pref.isBlindfold) ""
              else
                sit.board.pieces.map { case (pos, piece) =>
                  val klass = s"${piece.color.name} ${piece.role.name}"
                  s"""<piece class="$klass" style="transform: translate(${x(pos)}%, ${y(
                      pos,
                    )}%) scale(0.5)"></piece>"""
                } mkString ""
            }
          },
        ),
        shogigroundHand(
          Bottom,
          sit.variant,
          orient,
          sit.hands(orient),
        ),
      )
    }

  def shogiground(pov: Pov)(implicit ctx: Context): Frag =
    shogiground(
      sit = pov.game.situation,
      orient = pov.color,
      lastUsi = ~pov.game.history.lastUsi.map(_.positions),
    )

  def shogigroundEmpty(variant: Variant, orient: Color) =
    sgWrap(variant, orient)(
      frag(
        shogigroundHand(Top, variant, !orient, Hand.empty),
        sgBoard(sgSquares),
        shogigroundHand(Bottom, variant, orient, Hand.empty),
      ),
    )

  private val sgBoard   = tag("sg-board")
  private val sgSquares = tag("sg-squares")
  private val sgPieces  = tag("sg-pieces")

  private val sgHandWrap = tag("sg-hand-wrap")
  private val sgHand     = tag("sg-hand")

  private def sgWrap(variant: Variant, orient: Color)(content: Frag): Frag =
    div(
      cls := s"sg-wrap d-${variant.numberOfFiles}x${variant.numberOfRanks} orientation-${orient.name} preload",
    )(
      content,
    )

  sealed private trait Position
  private case object Top    extends Position
  private case object Bottom extends Position

  private def shogigroundHand(
      position: Position,
      variant: Variant,
      color: Color,
      hand: Hand,
  ): Option[Frag] =
    variant.supportsDrops option sgHandWrap(
      (cls := s"hand-${position.toString.toLowerCase} r-${variant.handRoles.size}"),
    ) {
      sgHand {
        raw {
          variant.handRoles.map { role =>
            s"""<sg-hp-wrap data-nb="${hand(
                role,
              )}"><piece class="${color.name} ${role.name}"></piece></sg-hp-wrap>"""
          } mkString ""
        }
      }
    }

}
