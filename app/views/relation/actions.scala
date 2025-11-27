package views.html.relation

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object actions {

  def apply(
      userId: lila.user.User.ID,
      relation: Option[lila.relation.Relation],
      followable: Boolean,
      blocked: Boolean,
      signup: Boolean = false,
  )(implicit ctx: Context) = {
    val isSystem = userId == lila.user.User.lishogiId

    div(cls := "relation-actions btn-rack")(
      ctx.userId map { myId =>
        (myId != userId) ?? frag(
          !blocked option frag(
            !isSystem option a(
              titleOrText(trans.challengeToPlay.txt()),
              href     := s"${routes.Lobby.home}?user=$userId#friend",
              cls      := "btn-rack__btn",
              dataIcon := Icons.challenge,
            ),
            a(
              titleOrText(trans.composeMessage.txt()),
              href     := routes.Msg.convo(userId),
              cls      := "btn-rack__btn",
              dataIcon := Icons.talk,
            ),
          ),
          relation match {
            case None =>
              frag(
                followable && !blocked option a(
                  cls  := "btn-rack__btn relation-button",
                  href := routes.Relation.follow(userId),
                  titleOrText(trans.follow.txt()),
                  dataIcon := Icons.thumbsUp,
                ),
                !isSystem option a(
                  cls  := "btn-rack__btn relation-button",
                  href := routes.Relation.block(userId),
                  titleOrText(trans.block.txt()),
                  dataIcon := Icons.forbidden,
                ),
              )
            case Some(true) =>
              a(
                dataIcon := Icons.thumbsUp,
                cls      := "btn-rack__btn relation-button text",
                href     := routes.Relation.unfollow(userId),
                titleOrText(trans.following.txt()),
              )
            case Some(false) =>
              a(
                dataIcon := Icons.forbidden,
                cls      := "btn-rack__btn relation-button text",
                href     := routes.Relation.unblock(userId),
                titleOrText(trans.blocked.txt()),
              )
          },
        )
      } getOrElse {
        signup option frag(
          trans.youNeedAnAccountToDoThat(),
          a(href := routes.Auth.login, cls := "signup")(trans.signUp()),
        )
      },
    )
  }
}
