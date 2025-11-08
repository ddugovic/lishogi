package views.html

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object bookmark {

  def toggle(g: lila.game.Game, bookmarked: Boolean)(implicit ctx: Context) =
    if (ctx.isAuth)
      a(
        cls := List(
          "bookmark"   -> true,
          "bookmarked" -> bookmarked,
        ),
        href  := routes.Bookmark.toggle(g.id),
        title := trans.bookmarkThisGame.txt(),
      )(
        span(g.showBookmarks),
        iconTag(Icons.starFull)(cls    := "on is3"),
        iconTag(Icons.starOutline)(cls := "off is3"),
      )
    else if (g.hasBookmarks)
      span(cls := "bookmark")(
        span(g.showBookmarks),
        iconTag(Icons.starFull)(cls := "is3"),
      )
    else emptyFrag
}
