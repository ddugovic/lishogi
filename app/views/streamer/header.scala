package views.html.streamer

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object header {

  import trans.streamer._

  def apply(s: lila.streamer.Streamer.WithUserAndStream, edit: Boolean = false)(implicit
      ctx: Context,
  ) = {
    val pic = bits.pic(s.streamer, s.user)
    div(cls := "streamer-header")(
      if (edit)
        frag(
          a(
            target := "_blank",
            href   := routes.Streamer.picture,
            title  := (if (s.streamer.hasPicture) changePicture.txt() else uploadPicture.txt()),
          )(
            pic,
            ctx.is(s.user) option div(cls := "picture-create button")(uploadPicture()),
          ),
        )
      else pic,
      div(cls := "overview")(
        h1(s.streamer.name),
        if (edit) bits.rules
        else
          frag(
            bits.headline(s.streamer),
            bits.services(s.streamer),
            bits.ats(s),
          ),
      ),
    )
  }
}
