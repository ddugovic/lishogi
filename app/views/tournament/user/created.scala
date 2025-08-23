package views.html
package tournament.user

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.common.paginator.Paginator
import lila.user.User

object created {

  private val path = "created"

  def apply(query: String, user: User, pager: Paginator[lila.tournament.Tournament])(implicit
      ctx: Context,
  ) =
    bits.layout(
      query = query,
      userOpt = user.some,
      path = path,
      moreJs = infiniteScrollTag,
    ) {
      if (pager.nbResults == 0)
        div(cls := "box-pad")(user.username, " hasn't created any tournament yet!")
      else
        div(cls := "tournament-list")(
          table(cls := "slist")(
            thead(
              tr(
                th(cls := "count")(pager.nbResults),
                th(colspan := 2)(h1(userLink(user, withOnline = true), " tournaments")),
                th(trans.winner()),
                th(trans.players()),
              ),
            ),
            tbody(cls := "infinitescroll")(
              pager.nextPage.map { np =>
                tr(
                  th(cls := "pager none")(
                    a(
                      rel  := "next",
                      href := routes.UserTournament.ofPlayer(path, user.username.some, np),
                    )(
                      trans.next(),
                    ),
                  ),
                )
              },
              pager.currentPageResults.map { t =>
                tr(cls := "paginated")(
                  td(cls := "icon")(tournamentIconTag(t)),
                  views.html.tournament.list.header(t),
                  td(momentFromNow(t.startsAt)),
                  td(cls := "winner")(
                    t.winnerId.isDefined option userIdLink(t.winnerId, withOnline = false),
                  ),
                  td(cls := "text", dataIcon := Icons.person)(t.nbPlayers.localize),
                )
              },
            ),
          ),
        )
    }
}
