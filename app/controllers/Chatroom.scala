package controllers

import lila.app._

final class Chatroom(env: Env) extends LilaController(env) {

  def get =
    AuthBody { implicit ctx => _ =>
      ctx.noKid ?? {
        NoLame {
          for {
            chat    <- env.chatroom.get(ctx.me)
            version <- env.chatroom.version(chat.chat.id)
          } yield (
            Ok(views.html.chatroom.show(chat, version))
          )
        }
      }
    }

}
