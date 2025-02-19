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

  def apply(u: User, pager: Paginator[lila.tournament.Tournament])(implicit ctx: Context) =
    bits.layout(
      u = u,
      title = s"${u.username} recent tournaments",
      path = path,
      moreJs = infiniteScrollTag,
    ) {
      if (pager.nbResults == 0)
        div(cls := "box-pad")(u.username, " hasn't created any tournament yet!")
      else
        div(cls := "tournament-list")(
          table(cls := "slist")(
            thead(
              tr(
                th(cls := "count")(pager.nbResults),
                th(colspan := 2)(h1(userLink(u, withOnline = true), " tournaments")),
                th(trans.winner()),
                th(trans.players()),
              ),
            ),
            tbody(cls := "infinitescroll")(
              pager.nextPage.map { np =>
                tr(
                  th(cls := "pager none")(
                    a(rel := "next", href := routes.UserTournament.path(u.username, path, np))(
                      "Next",
                    ),
                  ),
                )
              },
              pager.currentPageResults.map { t =>
                tr(cls := "paginated")(
                  td(cls := "icon")(iconTag(tournamentIconChar(t))),
                  views.html.tournament.list.header(t),
                  td(momentFromNow(t.startsAt)),
                  td(cls := "winner")(
                    t.winnerId.isDefined option userIdLink(t.winnerId, withOnline = false),
                  ),
                  td(cls := "text", dataIcon := "r")(t.nbPlayers.localize),
                )
              },
            ),
          ),
        )
    }
}
