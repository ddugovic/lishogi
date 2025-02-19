package lila.security

import play.api.i18n.Lang

import scalatags.Text.all._

import lila.common.EmailAddress
import lila.common.config._
import lila.i18n.I18nKeys.{ emails => trans }
import lila.user.User
import lila.user.UserRepo

final class PasswordReset(
    mailgun: Mailgun,
    userRepo: UserRepo,
    baseUrl: BaseUrl,
    tokenerSecret: Secret,
)(implicit ec: scala.concurrent.ExecutionContext) {

  import Mailgun.html._

  def send(user: User, email: EmailAddress)(implicit lang: Lang): Funit =
    tokener make user.id flatMap { token =>
      lila.mon.email.send.resetPassword.increment()
      val url = s"$baseUrl/password/reset/confirm/$token"
      mailgun send Mailgun.Message(
        to = email,
        subject = trans.passwordReset_subject.txt(user.username),
        text = s"""
${trans.passwordReset_intro.txt()}

${trans.passwordReset_clickOrIgnore.txt()}

$url

${trans.common_orPaste.txt()}

${Mailgun.txt.serviceNote}
""",
        htmlBody = emailMessage(
          pDesc(trans.passwordReset_intro()),
          p(trans.passwordReset_clickOrIgnore()),
          potentialAction(metaName("Reset password"), Mailgun.html.url(url)),
          serviceNote,
        ).some,
      )
    }

  def confirm(token: String): Fu[Option[User]] =
    tokener read token flatMap { _ ?? userRepo.byId }

  private val tokener = new StringToken[User.ID](
    secret = tokenerSecret,
    getCurrentValue = id => userRepo getPasswordHash id dmap (~_),
  )
}
