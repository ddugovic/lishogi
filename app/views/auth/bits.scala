package views.html
package auth

import controllers.routes
import play.api.data.Field
import play.api.data.Form

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.user.User

object bits {

  def formFields(username: Field, password: Field, emailOption: Option[Field], register: Boolean)(
      implicit ctx: Context,
  ) =
    frag(
      form3.group(username, if (register) trans.username() else trans.usernameOrEmail()) { f =>
        frag(
          form3.input(f)(autofocus, required, autocomplete := "username"),
          p(cls := "error username-exists none")(trans.usernameAlreadyUsed()),
        )
      },
      form3.passwordModified(password, trans.password())(
        autocomplete := (if (register) "new-password" else "current-password"),
      ),
      emailOption.map { email =>
        form3
          .group(email, trans.email(), help = frag("We will only use it for password reset.").some)(
            form3.input(_, typ = "email")(required),
          )
      },
    )

  def passwordReset(form: Form[_], captcha: lila.common.Captcha, ok: Option[Boolean] = None)(
      implicit ctx: Context,
  ) =
    views.html.base.layout(
      title = trans.passwordReset.txt(),
      moreCss = cssTag("user.auth"),
      moreJs = captchaTag,
    ) {
      main(cls := "auth auth-signup box box-pad")(
        h1(
          ok.map { r =>
            span(cls := (if (r) "is-green" else "is-red"), dataIcon := (if (r) "E" else "L"))
          },
          trans.passwordReset(),
        ),
        postForm(cls := "form3", action := routes.Auth.passwordResetApply)(
          form3.group(form("email"), trans.email())(form3.input(_, typ = "email")(autofocus)),
          views.html.base.captcha(form, captcha),
          form3.action(form3.submit(trans.emailMeALink())),
        ),
      )
    }

  def passwordResetSent(email: String)(implicit ctx: Context) =
    views.html.base.layout(
      title = trans.passwordReset.txt(),
    ) {
      main(cls := "page-small box box-pad")(
        h1(cls := "is-green text", dataIcon := "E")(trans.checkYourEmail()),
        p(trans.weHaveSentYouAnEmailTo(email)),
        p(trans.ifYouDoNotSeeTheEmailCheckOtherPlaces()),
      )
    }

  def passwordResetConfirm(u: User, token: String, form: Form[_], ok: Option[Boolean] = None)(
      implicit ctx: Context,
  ) =
    views.html.base.layout(
      title = s"${u.username} - ${trans.changePassword.txt()}",
      moreCss = cssTag("misc.form3"),
    ) {
      main(cls := "page-small box box-pad")(
        (ok match {
          case Some(true)  => h1(cls := "is-green text", dataIcon := "E")
          case Some(false) => h1(cls := "is-red text", dataIcon := "L")
          case _           => h1
        })(
          userLink(u, withOnline = false),
          " - ",
          trans.changePassword(),
        ),
        postForm(cls := "form3", action := routes.Auth.passwordResetConfirmApply(token))(
          form3.hidden(form("token")),
          form3.passwordModified(form("newPasswd1"), trans.newPassword())(
            autofocus,
            autocomplete := "new-password",
          ),
          form3.passwordModified(form("newPasswd2"), trans.newPasswordAgain())(
            autocomplete := "new-password",
          ),
          form3.globalError(form),
          form3.action(form3.submit(trans.changePassword())),
        ),
      )
    }

  def magicLink(form: Form[_], captcha: lila.common.Captcha, ok: Option[Boolean] = None)(implicit
      ctx: Context,
  ) =
    views.html.base.layout(
      title = trans.loginByEmail.txt(),
      moreCss = cssTag("user.auth"),
      moreJs = captchaTag,
    ) {
      main(cls := "auth auth-signup box box-pad")(
        h1(
          ok.map { r =>
            span(cls := (if (r) "is-green" else "is-red"), dataIcon := (if (r) "E" else "L"))
          },
          trans.loginByEmail(),
        ),
        p("We will send you an email containing a link to log you in."),
        postForm(cls := "form3", action := routes.Auth.magicLinkApply)(
          form3.group(form("email"), trans.email())(
            form3.input(_, typ = "email")(autofocus, autocomplete := "email"),
          ),
          views.html.base.captcha(form, captcha),
          form3.action(form3.submit(trans.emailMeALink())),
        ),
      )
    }

  def magicLinkSent(implicit ctx: Context) =
    views.html.base.layout(
      title = trans.loginByEmail.txt(),
    ) {
      main(cls := "page-small box box-pad")(
        h1(cls := "is-green text", dataIcon := "E")(trans.checkYourEmail()),
        p("We've sent you an email with a link."),
        p(trans.ifYouDoNotSeeTheEmailCheckOtherPlaces()),
      )
    }

  def checkYourEmailBanner(userEmail: lila.security.EmailConfirm.UserEmail) =
    frag(
      styleTag("""
body { margin-top: 45px; }
#email-confirm {
  height: 40px;
  background: #3893E8;
  color: #fff!important;
  font-size: 1.3em;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #666;
  box-shadow: 0 5px 6px rgba(0, 0, 0, 0.3);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 107;
}
#email-confirm a {
  color: #fff!important;
  text-decoration: underline;
  margin-left: 1em;
}
"""),
      div(id := "email-confirm")(
        s"Almost there, ${userEmail.username}! Now check your email (${userEmail.email.conceal}) for signup confirmation.",
        a(href := routes.Auth.checkYourEmail)("Click here for help"),
      ),
    )

  def tor()(implicit ctx: Context) =
    views.html.base.layout(
      title = "Tor exit node",
    ) {
      main(cls := "page-small box box-pad")(
        h1(cls := "text", dataIcon := "2")("Ooops"),
        p("Sorry, you can't signup to Lishogi through Tor!"),
        p("You can play, train and use almost all Lishogi features as an anonymous user."),
      )
    }
}
