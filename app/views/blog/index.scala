package views.html.blog

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.blog.MiniPost
import lila.common.paginator.Paginator

object index {

  def apply(
      pager: Paginator[lila.prismic.Document],
  )(implicit ctx: Context) = {
    views.html.base.layout(
      title = trans.blog.txt(),
      moreCss = cssTag("misc.blog"),
      moreJs = infiniteScrollTag,
      withHrefLangs = lila.i18n.LangList.EnglishJapanese.some,
    )(
      main(cls := "page-menu")(
        bits.menu(none),
        div(cls := "blog index page-menu__content page-small box")(
          div(cls := "box__top")(
            h1(trans.officialBlog()),
            a(
              cls      := "atom",
              href     := langHrefJP(routes.Blog.atom),
              dataIcon := Icons.broadcast,
            ),
          ),
          div(cls := "blog-cards list infinitescroll")(
            pager.currentPageResults flatMap MiniPost.fromDocument("blog", "wide") map { post =>
              bits.postCard(post, "paginated".some, h3)
            },
            pagerNext(pager, np => langHrefJP(routes.Blog.index(np))),
          ),
        ),
      ),
    )
  }

  def byYear(year: Int, posts: List[MiniPost])(implicit ctx: Context) =
    views.html.base.layout(
      title = trans.blogPostsFromYear.txt(year),
      moreCss = cssTag("misc.blog"),
    )(
      main(cls := "page-menu")(
        bits.menu(year.some),
        div(cls := "page-menu__content box")(
          div(cls := "box__top")(h1(trans.blogPostsFromYear(year))),
          st.section(
            div(cls := "blog-cards")(posts map { bits.postCard(_) }),
          ),
        ),
      ),
    )

}
