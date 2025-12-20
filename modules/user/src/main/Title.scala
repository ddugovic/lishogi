package lila.user

import play.api.i18n.Lang
import play.api.libs.json.Writes

import reactivemongo.api.bson.BSONHandler

import lila.common.Iso

case class Title(value: String) extends AnyVal with StringValue

object Title {

  implicit val titleIso: Iso.StringIso[Title]       = Iso.string[Title](Title.apply, _.value)
  implicit val titleBsonHandler: BSONHandler[Title] = lila.db.dsl.stringIsoHandler(Title.titleIso)
  implicit val titleJsonWrites: Writes[Title] = lila.common.Json.stringIsoWriter(Title.titleIso)

  val LM  = Title("LM")
  val BOT = Title("BOT")

  val all = List(
    Title("PRO"),
    Title("LP"),
    LM,
    BOT,
    Title("ADMIN"),
  )

  private def englishName(title: Title): String = title.value match {
    case "PRO" => "Professional"
    case "LP"  => "Ladies Pro"
    case "LM"  => "Lishogi Master"
    case "BOT" => "Shogi Robot"
    case _     => title.value
  }

  private def japaneseName(title: Title): String = title.value match {
    case "PRO"   => "プロ棋士"
    case "LP"    => "女流棋士"
    case "LM"    => "Lishogi マスター"
    case "BOT"   => "将棋ロボット"
    case "ADMIN" => "管理者"
    case _       => title.value
  }

  def trans(title: Title)(implicit lang: Lang) =
    if (lang.language == "ja") japaneseName(title) else englishName(title)

  def containsShogiOrJpId(str: String): Boolean =
    JSAProProfileUrlRegex.findFirstIn(str).nonEmpty ||
      JSALadyProfileUrlRegex.findFirstIn(str).nonEmpty

  // https://www.shogi.or.jp/player/pro/93.html
  private val JSAProProfileUrlRegex =
    """(?:https?://)?www\.shogi\.or\.jp/player/pro/(\d+).html""".r

  // https://www.shogi.or.jp/player/lady/59.html
  private val JSALadyProfileUrlRegex =
    """(?:https?://)?www\.shogi\.or\.jp/player/lady/(\d+).html""".r

}
