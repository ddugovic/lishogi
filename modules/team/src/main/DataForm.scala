package lila.team

import scala.concurrent.duration._

import play.api.data.Forms._
import play.api.data._

import lila.common.Form.cleanText
import lila.common.Form.numberIn
import lila.db.dsl._

final private[team] class DataForm(
    teamRepo: TeamRepo,
    lightUserApi: lila.user.LightUserApi,
    val captcher: lila.hub.actors.Captcher,
)(implicit ec: scala.concurrent.ExecutionContext)
    extends lila.hub.CaptchedForm {

  private object Fields {
    val name        = "name"        -> cleanText(minLength = 3, maxLength = 60)
    val location    = "location"    -> optional(cleanText(minLength = 3, maxLength = 80))
    val description = "description" -> cleanText(minLength = 30, maxLength = 2000)
    val open        = "open"        -> number
    val gameId      = "gameId"      -> text
    val move        = "move"        -> text
    val chat        = "chat"        -> numberIn(Team.ChatFor.all)
  }

  val create = Form(
    mapping(
      Fields.name,
      Fields.location,
      Fields.description,
      Fields.open,
      Fields.gameId,
      Fields.move,
    )(TeamSetup.apply)(TeamSetup.unapply)
      .verifying("This team already exists", d => !teamExists(d).await(2 seconds, "teamExists"))
      .verifying(captchaFailMessage, validateCaptcha _),
  )

  def edit(team: Team) =
    Form(
      mapping(
        Fields.location,
        Fields.description,
        Fields.open,
        Fields.chat,
      )(TeamEdit.apply)(TeamEdit.unapply),
    ) fill TeamEdit(
      location = team.location,
      description = team.description,
      open = if (team.open) 1 else 0,
      chat = team.chat,
    )

  val request = Form(
    mapping(
      "message" -> cleanText(minLength = 30, maxLength = 2000),
      Fields.gameId,
      Fields.move,
    )(RequestSetup.apply)(RequestSetup.unapply)
      .verifying(captchaFailMessage, validateCaptcha _),
  ) fill RequestSetup(
    message = "Hello, I would like to join the team!",
    gameId = "",
    move = "",
  )

  val apiRequest = Form(single("message" -> optional(cleanText(minLength = 30, maxLength = 2000))))

  val processRequest = Form(
    tuple(
      "process" -> nonEmptyText,
      "url"     -> nonEmptyText,
    ),
  )

  val selectMember = Form(
    single(
      "userId" -> lila.user.DataForm.historicalUsernameField,
    ),
  )

  def createWithCaptcha = withCaptcha(create)

  val pmAll = Form(
    single("message" -> cleanText(minLength = 3, maxLength = 9000)),
  )

  def leaders(t: Team) =
    Form(single("leaders" -> nonEmptyText)) fill t.leaders
      .flatMap(lightUserApi.sync)
      .map(_.name)
      .mkString(", ")

  private def teamExists(setup: TeamSetup) =
    teamRepo.coll.exists($id(Team nameToId setup.trim.name))
}

private[team] case class TeamSetup(
    name: String,
    location: Option[String],
    description: String,
    open: Int,
    gameId: String,
    move: String,
) {

  def isOpen = open == 1

  def trim =
    copy(
      name = name.trim,
      location = location map (_.trim) filter (_.nonEmpty),
      description = description.trim,
    )
}

private[team] case class TeamEdit(
    location: Option[String],
    description: String,
    open: Int,
    chat: Team.ChatFor,
) {

  def isOpen = open == 1

  def trim =
    copy(
      location = location map (_.trim) filter (_.nonEmpty),
      description = description.trim,
    )
}

private[team] case class RequestSetup(
    message: String,
    gameId: String,
    move: String,
)
