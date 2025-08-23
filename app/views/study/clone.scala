package views.html.study

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object clone {

  def apply(s: lila.study.Study)(implicit ctx: Context) =
    views.html.site.message(
      title = s"${trans.study.cloneStudy.txt()} ${s.name}",
      icon = Icons.study.some,
    ) {
      postForm(action := routes.Study.cloneApply(s.id.value))(
        p("This will create a new private study with the same chapters."),
        p("You will be the owner of that new study."),
        p("The two studies can be updated separately."),
        p("Deleting one study will ", strong("not"), " delete the other study."),
        p(
          submitButton(
            cls      := "submit button large text",
            dataIcon := Icons.study.some,
            style    := "margin: 30px auto; display: block; font-size: 2em;",
          )("Clone the study"),
        ),
        p(
          a(href := routes.Study.show(s.id.value), cls := "text", dataIcon := Icons.left)(
            trans.cancel(),
          ),
        ),
      )
    }
}
