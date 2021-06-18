package lila.study

import play.api.libs.ws.WSClient

final private class KifFetch(ws: WSClient) {

  private type Kif = String
  private val kifContentType = "application/x-shogi-kif"

  // http://www.shogigames.com/perl/chessgame?gid=1427487
  // http://www.shogigames.com/perl/nph-chesskif?text=1&gid=1427487
  // http://www.shogigames.com/kif/boleslavsky_ufimtsev_1944.kif?gid=1427487
  private val ShogibaseRegex = """shogigames\.com/.*[\?&]gid=(\d+)""".r.unanchored

  def fromUrl(url: String): Fu[Option[Kif]] =
    url match {
      //case ShogibaseRegex(id) => id.toIntOption ?? downloadShogigames
      case _                  => fuccess(none)
    }

  private def downloadShogigames(id: Int): Fu[Option[Kif]] = {
    ws.url(s"""http://www.shogigames.com/kif/any.kif?gid=$id""").get().dmap { res =>
      res.header("Content-Type").contains(kifContentType) option res.body
    }
  }
}
