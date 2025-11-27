package views.html.report

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object thanks {

  def apply(userId: String, blocked: Boolean)(implicit ctx: Context) = {

    val title = trans.thanksForReport.txt()

    views.html.base.layout(title = title, moreJs = jsTag("misc.thanks-report")) {
      main(cls := "page-small box box-pad")(
        h1(title),
        p(trans.moderatorsReportReview()),
        br,
        br,
        !blocked option p(
          trans.blockSuggestions(),
          submitButton(
            attr("data-action") := routes.Relation.block(userId),
            cls                 := "report-block button button-block button-spaced",
            st.title            := trans.block.txt(),
          )(
            span(cls := "text", dataIcon := Icons.forbidden)(
              trans.block.txt(),
              " - ",
              usernameOrId(userId),
            ),
          ),
        ),
        br,
        br,
        p(
          a(href := routes.Lobby.home)(trans.returnToHomepage()),
        ),
      )

    }
  }
}
