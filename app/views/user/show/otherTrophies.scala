package views.html.user.show

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.user.Trophy

object otherTrophies {

  def apply(info: lila.app.mashup.UserInfo)(implicit ctx: Context) =
    frag(
      info.shields.map { shield =>
        a(
          cls := "shield-trophy combo-trophy",
          ariaTitle(trans.tourname.xShield.txt(shield.categ.trans)),
          href := routes.Tournament.shields,
        )(shield.categ.icon)
      },
      info.revolutions.map { revol =>
        a(
          cls := "revol_trophy combo-trophy",
          ariaTitle(s"${revol.variant.name} Revolution"),
          href := routes.Tournament.show(revol.tourId),
        )(revol.icon)
      },
      info.trophies.filter(_.kind.withCustomImage).map { t =>
        a(
          awardCls(t),
          href := t.kind.url,
          ariaTitle(t.kind.name),
          style := "width: 65px; margin: 0 3px!important;",
        )(
          img(src := staticUrl(s"images/trophy/${t.kind._id}.png"), width := 65, height := 80),
        )
      },
      info.trophies.filter(_.kind.klass.has("icon3d")).sorted.map { trophy =>
        a(
          awardCls(trophy),
          href := trophy.kind.url,
          ariaTitle(trophy.kind.name),
        )(trophy.kind.icon)
      },
      info.isCoach option
        a(
          href := routes.Coach.show(info.user.username),
          cls  := "trophy award icon3d coach",
          ariaTitle(trans.coach.lishogiCoach.txt()),
        )(Icons.coach),
      (info.isStreamer && ctx.noKid) option {
        val streaming = isStreaming(info.user.id)
        views.html.streamer.bits.redirectLink(info.user.username, streaming.some)(
          cls := List(
            "trophy award icon3d streamer" -> true,
            "streaming"                    -> streaming,
          ),
          ariaTitle(if (streaming) "Live now!" else "Lishogi Streamer"),
        )(Icons.mic)
      },
    )

  private def awardCls(t: Trophy) = cls := s"trophy award ${t.kind._id} ${~t.kind.klass}"
}
