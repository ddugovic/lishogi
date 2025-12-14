package views.html.site

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.rating.Rank

object ranks {

  def apply()(implicit ctx: Context) =
    views.html.base.layout(
      moreCss = cssTag("misc.page"),
      title = trans.ranks.txt(),
    ) {
      main(cls := "page-small box box-pad page")(
        h1(trans.ranks()),
        div(cls := "body")(
          p(trans.ranksAfterStable()),
          br,
          table(cls := "normal-table ranks-table")(
            thead(
              tr(
                th("日本語"),
                th("English"),
                th(trans.rating()),
              ),
            ),
            tbody(
              for (rank <- Rank.all.toList)
                yield tr(
                  td(rankTag(rank)(lila.i18n.jaLang)),
                  td(rankTag(rank)(lila.i18n.enLang)),
                  td(
                    if (rank.max == lila.rating.Glicko.maxRating) s"${rank.min}+"
                    else s"${rank.min} - ${rank.max - 1}",
                  ),
                ),
            ),
          ),
        ),
      )
    }
}
