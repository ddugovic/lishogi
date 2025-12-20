package lila.app
package templating

import play.api.i18n.Lang

import lila.api.Context
import lila.app.ui.ScalatagsTemplate._
import lila.forum.Post

trait ForumHelper { self: UserHelper with StringHelper with HasEnv =>

  private object Granter extends lila.forum.Granter {

    protected def userBelongsToTeam(teamId: String, userId: String): Fu[Boolean] =
      env.team.api.belongsTo(teamId, userId)

    protected def userOwnsTeam(teamId: String, userId: String): Fu[Boolean] =
      env.team.api.leads(teamId, userId)
  }

  def isGrantedWrite(categSlug: String)(implicit ctx: Context) =
    Granter isGrantedWrite categSlug

  def authorName(post: Post)(implicit lang: Lang) =
    post.userId match {
      case Some(userId) =>
        div(cls := List("mod-icon" -> ~post.modIcon))(
          showUsernameById(
            userId.some,
            withLink = false,
            withOnline = true,
          ),
        )
      case None => anonSpan
    }

  def authorLink(
      post: Post,
      withOnline: Boolean = true,
  )(implicit lang: Lang): Frag =
    if (post.erased) span(cls := "author")("<erased>")
    else
      post.userId.fold(anonSpan) { userId =>
        div(cls := List("mod-icon" -> ~post.modIcon))(
          showUsernameById(
            userId.some,
            withOnline = withOnline,
          ),
        )
      }
}
