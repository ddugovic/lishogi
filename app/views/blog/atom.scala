package views.html.blog

import controllers.routes
import play.api.mvc.Call

import org.joda.time.DateTime
import org.joda.time.format.ISODateTimeFormat

import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.common.paginator.Paginator

object atom {

  def apply(
      pager: Paginator[lila.prismic.Document],
      blogLang: lila.blog.BlogLang,
  )(implicit prismic: lila.blog.BlogApi.Context) =
    frag(
      raw("""<?xml version="1.0" encoding="UTF-8"?>"""),
      raw(
        s"""<feed xml:lang="${blogLang.code}" xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">""",
      ),
      tag("id")(blogTopUrl(routes.Blog.index(), blogLang)),
      link(
        rel  := "alternate",
        tpe  := "text/html",
        href := blogTopUrl(routes.Blog.index(), blogLang),
      ),
      link(
        rel  := "self",
        tpe  := "application/atom+xml",
        href := blogTopUrl(routes.Blog.atom, blogLang),
      ),
      tag("title")("lishogi.org blog"),
      tag("updated")(pager.currentPageResults.headOption.flatMap(atomDate("blog.date"))),
      pager.currentPageResults.flatMap(doc => lila.blog.FullPost.fromDocument("blog")(doc)).map {
        post =>
          tag("entry")(
            tag("id")(s"$netBaseUrl${routes.Blog.show(post.id)}"),
            tag("published")(atomDate(post.date)),
            tag("updated")(atomDate(post.date)),
            link(
              rel  := "alternate",
              tpe  := "text/html",
              href := s"$netBaseUrl${routes.Blog.show(post.id)}",
            ),
            tag("title")(post.title),
            tag("category")(
              tag("term")(post.category),
              tag("label")(slugify(post.category)),
            ),
            tag("content")(tpe := "html")(
              post.doc.getText(s"${post.coll}.shortlede"),
              "<br>", // yes, scalatags encodes it.
              st.img(src := post.image).render,
              "<br>",
              post.doc
                .getHtml(s"${post.coll}.body", prismic.linkResolver)
                .map(lila.blog.Youtube.fixStartTimes)
                .map(lila.blog.BlogTransform.addProtocol),
            ),
            tag("tag")("media:thumbnail")(attr("url") := post.image),
            tag("author")(tag("name")(post.author)),
          )
      },
      raw("</feed>"),
    )

  private def blogTopUrl(call: Call, blogLang: lila.blog.BlogLang) =
    s"${netBaseUrl}${call.url}${(blogLang == lila.blog.BlogLang.Japanese) ?? "?lang=ja"}"

  private val atomDateFormatter                = ISODateTimeFormat.dateTime
  private def atomDate(date: DateTime): String = atomDateFormatter print date
  private def atomDate(field: String)(doc: lila.prismic.Document): Option[String] =
    doc getDate field map (_.value.toDateTimeAtStartOfDay) map atomDate
}
