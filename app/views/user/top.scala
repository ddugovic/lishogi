package views.html
package user

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.user.User

object top {

  def apply(perfType: lila.rating.PerfType, users: List[User.LightPerf])(implicit ctx: Context) = {

    val title = s"${trans.leaderboard.txt()} - ${perfType.trans}"
    val desc  = trans.topXPlayersInY.txt("200", perfType.trans)

    views.html.base.layout(
      title = title,
      moreCss = frag(
        cssTag("misc.slist"),
        cssTag("misc.page"),
      ),
      openGraph = lila.app.ui
        .OpenGraph(
          title = title,
          url = s"$netBaseUrl${routes.User.topNb(200, perfType.key).url}",
          description = desc,
        )
        .some,
    )(
      main(cls := "page-small box")(
        h1(a(cls := "text", href := routes.User.list, dataIcon := Icons.left), title),
        p(cls := "center")(desc),
        table(cls := "slist slist-pad")(
          tbody(
            users.zipWithIndex.map { case (u, i) =>
              tr(
                td(i + 1),
                td(showUsernameLight(u.user, rating = u.rating.some)),
                td(u.rating),
                td(showRatingProgress(u.progress)),
              )
            },
          ),
        ),
      ),
    )
  }

}
