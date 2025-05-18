package controllers

import views._

import lila.app._

final class UserTournament(env: Env) extends LilaController(env) {

  def ofPlayer(path: String, name: Option[String] = none, page: Int = 1) =
    Open { implicit ctx =>
      Reasonable(page) {
        val fixed: Option[String] = name.map(_.trim).filter(_.nonEmpty)
        val query                 = ~fixed
        fixed.fold(fuccess(ctx.me))(env.user.repo.enabledNamed) flatMap { userOpt =>
          userOpt.fold {
            val allPaths = List("recent", "best", "chart", "created", "upcoming")
            if (allPaths contains path)
              fuccess(Ok(html.tournament.user.bits.empty(query, path)))
            else notFound
          } { user =>
            path match {
              case "recent" =>
                env.tournament.leaderboardApi.recentByUser(user, page).map { pager =>
                  Ok(html.tournament.user.bits.recent(query, user, pager))
                }
              case "best" =>
                env.tournament.leaderboardApi.bestByUser(user, page).map { pager =>
                  Ok(html.tournament.user.bits.best(query, user, pager))
                }
              case "chart" =>
                env.tournament.leaderboardApi.chart(user).map { data =>
                  Ok(html.tournament.user.chart(query, user, data))
                }
              case "created" =>
                env.tournament.api.byOwnerPager(user, page).map { pager =>
                  Ok(html.tournament.user.created(query, user, pager))
                }
              case "upcoming" if ctx is user =>
                env.tournament.api.upcomingByPlayerPager(user, page).map { pager =>
                  Ok(html.tournament.user.upcoming(query, user, pager))
                }
              case _ => notFound
            }
          }
        }
      }
    }

  def bc(path: String, name: String) =
    Action {
      MovedPermanently(routes.UserTournament.ofPlayer(path, name.some).url)
    }

  def arrangements(order: String, page: Int) =
    AuthBody { implicit ctx => implicit me =>
      Reasonable(page) {
        val pager =
          if (order == "upcoming") env.tournament.api.arrangemenstUpcoming(me, page)
          else env.tournament.api.arrangemenstUpdated(me, page)
        pager.map(p => Ok(html.tournament.user.arrangements.paginated(p, order)))
      }
    }
}
