package controllers

import play.api.mvc._
import views._

import scalatags.Text.all.Frag

import lila.api.Context
import lila.app._
import lila.memo.CacheApi._

final class KeyPages(env: Env)(implicit ec: scala.concurrent.ExecutionContext) {

  def home(status: Results.Status)(implicit ctx: Context): Fu[Result] =
    homeHtml
      .dmap { html =>
        env.lilaCookie.ensure(ctx.req)(status(html))
      }

  def homeHtml(implicit ctx: Context): Fu[Frag] =
    env
      .preloader(
        posts = env.forum.recent(ctx.me, env.team.cached.teamIdsList).nevermind,
        tours = env.tournament.pager.Featured.getHomepage.nevermind,
        events = env.event.api.promoteTo(ctx.req).nevermind,
        simuls = env.simul.allCreatedFeaturable.get {}.nevermind,
        studies = env.study.hotFeaturable.getUnit.nevermind,
        streamerSpots = env.streamer.homepageMaxSetting.get(),
      )
      .mon(_.lobby segment "preloader.total")
      .map { h =>
        lila.mon.chronoSync(_.lobby segment "renderSync") {
          html.lobby.home(h)
        }
      }

  def notFound(ctx: Context): Result = {
    Results.NotFound(html.base.notFound()(ctx))
  }

  def blacklisted: Result = Results.Unauthorized(blacklistMessage)

  private val blacklistMessage =
    s"""Sorry, your IP address has been used to violate the ToS, and is now blacklisted. If you believe this to be a mistake contact lishogi.
申し訳ありませんが、あなたのIPアドレスが利用規約（ToS）違反に使用されたため、現在ブラックリストに登録されています。これが誤りだと思われる場合は、「lishogi」までご連絡ください。"""
}
