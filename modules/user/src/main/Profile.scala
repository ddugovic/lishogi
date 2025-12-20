package lila.user

import play.api.i18n.Lang

case class Profile(
    country: Option[String] = None,
    location: Option[String] = None,
    bio: Option[String] = None,
    firstName: Option[String] = None,
    lastName: Option[String] = None,
    links: Option[String] = None,
) {

  def nonEmptyRealName(lang: => Option[Lang]) =
    (ne(firstName), ne(lastName)) match {
      case (None, None) => none
      case (f, l) =>
        val ordered =
          if (lang.exists(_.language == "ja")) List(l, f)
          else List(f, l)

        ordered.flatten.mkString(" ").some
    }

  def countryInfo = country flatMap Countries.info

  def countryCode = countryInfo.map(_.code)

  def nonEmptyLocation = ne(location)

  def nonEmptyBio = ne(bio)

  def isEmpty = List(country, bio, firstName, lastName).count(_.isDefined) == 0

  def actualLinks: List[Link] = links ?? Links.make

  private def ne(str: Option[String]) = str.filter(_.nonEmpty)
}

object Profile {

  val default = Profile()

  import reactivemongo.api.bson.Macros
  private[user] val profileBSONHandler = Macros.handler[Profile]
}
