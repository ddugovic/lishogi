package views.html
package tournament.user

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.common.paginator.Paginator

object arrangements {

  def paginated(pager: Paginator[lila.tournament.Arrangement], order: String)(implicit
      ctx: Context,
  ) = {
    val orders = List(
      ("upcoming", trans.broadcast.upcoming()),
      ("updated", trans.study.recentlyUpdated()),
    )
    val curOrder = orders.find(_._1 == order).getOrElse(orders.head)

    val title = trans.tourArrangements.myArrangedGames.txt()

    views.html.base.layout(
      title = title,
      moreCss = cssTag("tournament.home"),
      moreJs = infiniteScrollTag,
    ) {
      main(cls := "page-menu")(
        views.html.tournament.home.menu("arrangements"),
        st.section(cls := "page-menu__content tour-home__list box")(
          div(cls := "box__top")(
            h1(title),
            views.html.base.bits.mselect(
              "arrangements-orders",
              span(curOrder._2),
              orders map { o =>
                a(href := s"${routes.UserTournament.arrangements(o._1, 1)}")(o._2)
              },
            ),
          ),
          if (pager.currentPageResults.isEmpty)
            div(cls := "notours")(
              p(trans.study.noneYet()),
            )
          else
            table(cls := "slist")(
              thead(
                tr(
                  th(colspan := 3)(),
                  th(trans.search.date()),
                ),
              ),
              tbody(cls := "tours arrangements list infinitescroll")(
                pagerNextTable(pager, np => routes.UserTournament.arrangements(order, np).url),
                pager.currentPageResults.map { arr =>
                  tr(cls := "paginated")(
                    td(cls := "icon")(),
                    td(colspan := 2)(cls := "header")(
                      a(
                        href := s"${routes.Tournament.show(arr.tourId).url}#${arr.id}",
                      )(
                        span(cls := "name") {
                          val sortedUsers =
                            arr.users.sortBy(user => if (~ctx.userId.map(_ == user.id)) 0 else 1)
                          sortedUsers.map(u => usernameOrId(u.id)).mkString(" - ")
                        },
                        span(cls := "setup")(
                          tournamentIdToName(arr.tourId),
                        ),
                      ),
                    ),
                    td(cls := "date")(
                      arr.scheduledAt.fold[Frag](raw("-"))(scheduledAt =>
                        momentFromNow(scheduledAt),
                      ),
                    ),
                  )
                },
              ),
            ),
        ),
      )
    }
  }

}
