package views.html.tournament

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object homepageSpotlight {

  def apply(tour: lila.tournament.Tournament)(implicit ctx: Context) =
    a(href := routes.Tournament.show(tour.id), cls := s"tour-spotlight id_${tour.id}")(
      frag(
        // To avoid fetching svg sprite for anons on homepage
        if (ctx.isAnon) div(cls := "licon")(Icons.trophy)
        else tournamentIconTag(tour),
        span(cls := "content")(
          span(cls := "name")(tour.trans),
          frag(
            tour.spotlight map { spot => span(cls := "headline")(spot.headline) },
            span(cls := "more")(
              trans.nbPlayers.plural(tour.nbPlayers, tour.nbPlayers.localize),
              " - ",
              if (tour.isStarted) trans.finishesX(momentFromNow(tour.finishesAt))
              else momentFromNow(tour.startsAt),
            ),
          ),
        ),
      ),
    )
}
