package views.html.site

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object page {

  def apply(
      doc: lila.prismic.Document,
      resolver: lila.prismic.DocumentLinkResolver,
      withHrefLangs: Option[lila.i18n.LangList.AlternativeLangs] = None,
  )(implicit ctx: Context) =
    views.html.base.layout(
      moreCss = cssTag("misc.page"),
      title = ~doc.getText("doc.title"),
      withHrefLangs = withHrefLangs,
    ) {
      main(cls := "page-small box box-pad page")(
        h1(doc.getText("doc.title")),
        div(cls := "body")(
          raw(~doc.getHtml("doc.content", resolver)),
        ),
      )
    }
}
