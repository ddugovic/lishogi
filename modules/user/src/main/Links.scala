package lila.user

object Links {

  def make(text: String): List[Link] = text.linesIterator.to(List).map(_.trim).flatMap(toLink)

  private val UrlRegex = """^(?:https?://)?+([^/]+)""".r.unanchored

  private def toLink(line: String): Option[Link] =
    line match {
      case UrlRegex(domain) =>
        Link(
          site = Link.Site.allKnown find (_ matches domain) getOrElse Link.Site.Other(domain),
          url = if (line startsWith "http") line else s"https://$line",
        ).some
      case _ => none
    }
}

case class Link(site: Link.Site, url: String)

object Link {

  sealed abstract class Site(val name: String, val domains: List[String]) {

    def matches(domain: String) =
      domains.exists { d =>
        domain endsWith d
      }
  }

  object Site {
    case object Twitter              extends Site("Twitter", List("twitter.com"))
    case object Facebook             extends Site("Facebook", List("facebook.com"))
    case object YouTube              extends Site("YouTube", List("youtube.com"))
    case object Twitch               extends Site("Twitch", List("twitch.tv"))
    case object GitHub               extends Site("GitHub", List("github.com"))
    case object VKontakte            extends Site("VKontakte", List("vk.com"))
    case class Other(domain: String) extends Site(domain, List(domain))

    val allKnown: List[Site] = List(
      Twitter,
      Facebook,
      YouTube,
      Twitch,
      GitHub,
      VKontakte,
    )
  }
}
