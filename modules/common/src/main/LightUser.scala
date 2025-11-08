package lila.common

import play.api.libs.json._

case class LightUser(
    id: String,
    name: String,
    title: Option[String],
    isPatron: Boolean,
    countryCode: Option[String],
) {

  def isBot = title has "BOT"
}

object LightUser {

  private type UserID = String

  implicit val lightUserWrites: OWrites[LightUser] = OWrites[LightUser] { u =>
    writeNoId(u) + ("id" -> JsString(u.id))
  }

  def writeNoId(u: LightUser): JsObject =
    Json
      .obj("name" -> u.name)
      .add("title" -> u.title)
      .add("patron" -> u.isPatron)
      .add("country" -> u.countryCode)

  def fallback(name: String) =
    LightUser(
      id = name.toLowerCase,
      name = name,
      title = none,
      isPatron = false,
      countryCode = none,
    )

  final class Getter(f: UserID => Fu[Option[LightUser]]) extends (UserID => Fu[Option[LightUser]]) {
    def apply(u: UserID) = f(u)
  }

  final class GetterSync(f: UserID => Option[LightUser]) extends (UserID => Option[LightUser]) {
    def apply(u: UserID) = f(u)
  }

}
