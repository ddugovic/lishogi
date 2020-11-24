package lila.simul

import play.api.data._
import play.api.data.Forms._
import play.api.data.validation.{ Constraint, Constraints }
import lila.user.User

import chess.StartingPosition
import lila.common.Form._

object SimulForm {

  val clockTimes       = (5 to 30 by 5) ++ (40 to 60 by 10) ++ (75 to 120 by 15)
  val clockTimeDefault = 20
  val clockTimeChoices = options(clockTimes, "%d minute{s}")

  val clockByoyomis       = (10 to 60 by 10) ++ (75 to 180 by 15)
  val clockByoyomiDefault = 60
  val clockByoyomiChoices = options(clockByoyomis, "%d second{s}")

  val clockExtras       = (5 to 15 by 5) ++ (20 to 60 by 10) ++ (90 to 120 by 30)
  val clockExtraChoices = options(clockExtras, "%d minute{s}")
  val clockExtraDefault = 10

  val colors = List("white", "random", "black")
  val colorChoices = List(
    "white"  -> "Black",
    "random" -> "Random",
    "black"  -> "White"
  )
  val colorDefault = "white"

  private def nameType(host: User) =
    clean(text).verifying(
      Constraints minLength 2,
      Constraints maxLength 40,
      Constraints.pattern(
        regex = """[\p{L}\p{N}-\s:,;]+""".r,
        error = "Invalid characters"
      ),
      Constraint[String] { (t: String) =>
        if (t.toLowerCase contains "lishogi")
          validation.Invalid(validation.ValidationError("Must not contain \"lishogi\""))
        else validation.Valid
      },
      Constraint[String] { (t: String) =>
        if (
          t.toUpperCase.split(' ').exists { word =>
            lila.user.Title.all.exists {
              case (title, name) =>
                !host.title.has(title) && {
                  title.value == word || name.toUpperCase == word
                }
            }
          }
        )
          validation.Invalid(validation.ValidationError("Must not contain a title"))
        else validation.Valid
      }
    )

  def create(host: User) =
    Form(
      mapping(
        "name"         -> nameType(host),
        "clockTime"    -> numberIn(clockTimeChoices),
        "clockByoyomi" -> numberIn(clockByoyomiChoices),
        "clockExtra"   -> numberIn(clockExtraChoices),
        "variants" -> list {
          number.verifying(
            Set(
              chess.variant.Standard.id,
              chess.variant.Chess960.id,
              chess.variant.KingOfTheHill.id,
              chess.variant.ThreeCheck.id,
              chess.variant.Antichess.id,
              chess.variant.Atomic.id,
              chess.variant.Horde.id,
              chess.variant.RacingKings.id,
              chess.variant.Crazyhouse.id
            ) contains _
          )
        }.verifying("At least one variant", _.nonEmpty),
        "position" -> optional(nonEmptyText),
        "color"    -> stringIn(colorChoices),
        "text"     -> clean(text),
        "team"     -> optional(nonEmptyText)
      )(Setup.apply)(Setup.unapply)
    ) fill Setup(
      name = host.titleUsername,
      clockTime = clockTimeDefault,
      clockByoyomi = clockByoyomiDefault,
      clockExtra = clockExtraDefault,
      variants = List(chess.variant.Standard.id),
      position = StartingPosition.initial.fen.some,
      color = colorDefault,
      text = "",
      team = none
    )

  val positions = StartingPosition.allWithInitial.map(_.fen)
  val positionChoices = StartingPosition.allWithInitial.map { p =>
    p.fen -> p.fullName
  }
  val positionDefault = StartingPosition.initial.fen

  def startingPosition(fen: String, variant: chess.variant.Variant): StartingPosition =
    Simul.fenIndex.get(fen).ifTrue(variant.standard) | StartingPosition.initial

  def setText = Form(single("text" -> text))

  case class Setup(
      name: String,
      clockTime: Int,
      clockByoyomi: Int,
      clockExtra: Int,
      variants: List[Int],
      position: Option[String],
      color: String,
      text: String,
      team: Option[String]
  )
}
