package views.html
package user

import controllers.routes

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object newPlayer {

  def apply()(implicit ctx: Context) =
    views.html.base.layout(
      title = trans.welcomeToX.txt("lishogi.org"),
      moreCss = frag(cssTag("misc.page"), cssTag("user.new-player")),
      wrapClass = "full-screen-force",
      moreJs = jsTag(
        "user.new-player",
      ),
      robots = false,
    )(
      main(cls := "page-small box box-pad page")(
        h1(trans.welcomeToX.txt("lishogi.org")),
        p(trans.newPlayerIntro.txt()),
        ctx.isAnon option a(cls := "button", href := routes.Auth.signup)(
          trans.newPlayerRegisterCta.txt(),
        ),
        div(cls := "new-player-list")(
          row(
            trans.preferences.preferences.txt(),
            trans.newPlayerPreferences.txt(),
            Icons.gear,
            "",
          ),
          row(
            trans.learn.learnShogi.txt(),
            trans.newPlayerLearn.txt(),
            Icons.toriGate,
            routes.Learn.index.url,
          ),
          row(
            trans.playOtherPlayers.txt(),
            trans.newPlayerPlayPeople.txt(),
            Icons.challenge,
            routes.Lobby.home.url,
          ),
          row(
            trans.playWithTheMachine.txt(),
            trans.newPlayerPlayAi.txt(),
            Icons.cogs,
            s"${routes.Lobby.home}#ai",
          ),
          row(
            trans.tournaments.txt(),
            trans.newPlayerTournaments.txt(),
            Icons.trophy,
            routes.Tournament.homeDefault(1).url,
          ),
          row(
            trans.puzzles.txt(),
            trans.newPlayerPuzzles.txt(),
            Icons.puzzle,
            routes.Puzzle.home.url,
          ),
          row(
            trans.studyMenu.txt(),
            trans.newPlayerStudies.txt(),
            Icons.study,
            routes.Study.allDefault(1).url,
          ),
        ),
        p(trans.exploreSiteAndHaveFun()),
      ),
    )

  private def row(title: String, description: String, icon: String, link: String) =
    a(cls := "row", href := link, target := (link.nonEmpty option "_blank"))(
      iconTag(icon),
      h2(title),
      p(description),
    )

}
