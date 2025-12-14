package views
package html.puzzle

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.common.paginator.Paginator
import lila.puzzle.Puzzle
import lila.puzzle.PuzzleReport

object report {

  def apply(
      reports: Paginator[PuzzleReport],
      puzzleOrClosed: Either[Puzzle.Id, Boolean],
  )(implicit
      ctx: Context,
  ) =
    views.html.base.layout(
      title = s"Puzzle reports",
      moreCss = cssTag("puzzle.reports"),
      moreJs = infiniteScrollTag,
    )(
      main(cls := "page-menu")(
        bits.pageMenu("reports"),
        div(cls := "page-menu__content puzzle-report box box-pad")(
          h1(
            puzzleOrClosed.fold(
              p => s"Reports of #${p.value}",
              closed => s"All ${!closed ?? "un"}closed reports",
            ),
          ),
          table(cls := "slist slist-pad")(
            thead(
              tr(
                th("Puzzle id"),
                th("Reported by"),
                th("Description"),
                th(),
              ),
            ),
            tbody(cls := "infinite-scroll")(
              reports.currentPageResults.map { report =>
                tr(
                  td(a(href := routes.Puzzle.show(report.puzzle.value))(report.puzzle)),
                  td(showUsernameById(report.by.some, withOnline = false)),
                  td(~report.text),
                  td(
                    postForm(
                      action := routes.Puzzle.reportClose(
                        report._id,
                        puzzleOrClosed.left.toOption.map(_.value),
                        !report.closed,
                      ),
                    )(
                      submitButton(
                        dataIcon := (if (report.closed) Icons.reload else Icons.cancel),
                        cls      := s"fbt${!report.closed ?? " fbt-red"}",
                      ),
                    ),
                  ),
                )
              },
              pagerNextTable(
                reports,
                np => routes.Puzzle.reportList(np).url,
              ),
            ),
          ),
        ),
      ),
    )
}
