package views.html
package base

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object notFound {

  def apply()(implicit ctx: Context) =
    layout(
      title = trans.pageNotFound.txt(),
      moreCss = cssTag("misc.not-found"),
      moreJs = jsTag("misc.hakoirimusume"),
    ) {
      main(cls := "not-found page-small box box-pad")(
        header(
          h1("404"),
          div(
            strong(trans.pageNotFound.txt()),
            p(
              a(href := routes.Lobby.home)(trans.returnToHomepage()),
            ),
          ),
        ),
        div(cls := "game-wrap")(
          p(
            cls := "objective",
          )(
            trans.hakoiriMusumeExplanation(),
          ),
          div(id := "game"),
          div(cls := "game-help")(
            span(id   := "move-cnt"),
            button(id := "reset", trans.reset()),
          ),
          p(cls := "credits")(
            a(
              href   := "https://github.com/WandererXII/sliding-puzzles",
              target := "_blank",
            )("Sliding puzzles"),
          ),
        ),
      )
    }
}
