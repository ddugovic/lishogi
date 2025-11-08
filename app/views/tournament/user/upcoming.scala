package views.html
package tournament.user

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.common.paginator.Paginator
import lila.user.User

object upcoming {

  def apply(query: String, user: User, pager: Paginator[lila.tournament.Tournament])(implicit
      ctx: Context,
  ) =
    bits.layout(
      query = query,
      userOpt = user.some,
      path = "upcoming",
    ) {
      if (pager.nbResults == 0)
        div(cls := "box-pad")(user.username, " hasn't joined any tournament yet!")
      else
        div(cls := "tournament-list")(
          table(cls := "slist")(
            thead(
              tr(
                th(cls := "count")(pager.nbResults),
                th(colspan := 2)(
                  h1(showUsername(user, withOnline = true), " upcoming tournaments"),
                ),
                th(trans.players()),
              ),
            ),
            tbody(
              pager.currentPageResults.map { t =>
                tr(
                  td(cls := "icon")(tournamentIconTag(t)),
                  views.html.tournament.list.header(t),
                  td(momentFromNow(t.startsAt)),
                  td(cls := "text", dataIcon := Icons.person)(t.nbPlayers.localize),
                )
              },
            ),
          ),
        )
    }
}
