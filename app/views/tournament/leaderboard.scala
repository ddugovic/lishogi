package views.html.tournament

import controllers.routes
import play.api.i18n.Lang

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.rating.PerfType

object leaderboard {

  private def freqWinner(w: lila.tournament.Winner)(implicit lang: Lang) =
    li(
      userIdLink(w.userId.some),
      a(
        cls   := "tourname",
        title := showDate(w.date),
        href  := routes.Tournament.show(w.tourId),
      )(w.trans),
    )

  private val section = st.section(cls := "tournament-leaderboards__item")

  private def freqWinners(
      fws: lila.tournament.FreqWinners,
      perfType: PerfType,
      prefix: String = "",
  )(implicit
      lang: Lang,
  ) =
    section(
      h2(cls := "text", dataIcon := perfType.icon)(s"$prefix${perfType.trans}"),
      ul(
        fws.yearly.map { w =>
          freqWinner(w)
        },
        fws.monthly.map { w =>
          freqWinner(w)
        },
        fws.custom.map { w =>
          freqWinner(w)
        },
      ),
    )

  def apply(winners: lila.tournament.AllWinners)(implicit ctx: Context) =
    views.html.base.layout(
      title = trans.tournamentLeaderboard.txt(),
      moreCss = cssTag("tournament.leaderboard"),
      wrapClass = "full-screen-force",
    ) {

      main(cls := "page-menu")(
        views.html.user.bits.communityMenu("tournament"),
        div(cls := "page-menu__content box box-pad")(
          h1(trans.tournamentWinners()),
          div(cls := "tournament-leaderboards")(
            freqWinners(winners.realTime, PerfType.RealTime),
            freqWinners(winners.correspondence, PerfType.Correspondence),
            lila.tournament.WinnersApi.variants.map { v =>
              PerfType.byVariant(v).map { pt =>
                winners.variants.get(pt.key).map { w =>
                  freqWinners(w, pt)
                }
              }
            },
          ),
        ),
      )
    }
}
