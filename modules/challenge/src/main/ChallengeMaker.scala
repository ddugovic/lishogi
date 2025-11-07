package lila.challenge

import play.api.i18n.Lang

import lila.challenge.Challenge.TimeControl
import lila.game.Game
import lila.game.Pov
import lila.user.User

final class ChallengeMaker(
    granter: ChallengeGranter,
    userRepo: lila.user.UserRepo,
    gameRepo: lila.game.GameRepo,
    rematches: lila.game.Rematches,
    idGenerator: lila.game.IdGenerator,
)(implicit ec: scala.concurrent.ExecutionContext) {

  def makeRematchFor(gameId: Game.ID, dest: User): Fu[Option[Challenge]] =
    gameRepo game gameId flatMap {
      _ ?? { game =>
        game.opponentByUserId(dest.id).flatMap(_.userId) ?? userRepo.byId flatMap {
          _ ?? { challenger =>
            Pov(game, challenger) ?? { pov =>
              makeRematch(pov, challenger, dest) dmap some
            }
          }
        }
      }
    }

  def makeRematchOf(game: Game, challenger: User): Fu[Option[Challenge]] =
    Pov.ofUserId(game, challenger.id) ?? { pov =>
      pov.opponent.userId ?? userRepo.byId flatMap {
        _ ?? { dest =>
          makeRematch(pov, challenger, dest) dmap some
        }
      }
    }

  // pov of the challenger
  private def makeRematch(pov: Pov, challenger: User, dest: User): Fu[Challenge] = {
    rematches.offer(pov.ref) map { nextId =>
      val timeControl = (pov.game.clock, pov.game.daysPerTurn) match {
        case (Some(clock), _) => TimeControl.Clock(clock.config)
        case (_, Some(days))  => TimeControl.Correspondence(days)
        case _                => TimeControl.Unlimited
      }
      Challenge.make(
        id = nextId,
        variant = pov.game.variant,
        initialSfen = pov.game.initialSfen,
        timeControl = timeControl,
        mode = pov.game.mode,
        proMode = pov.game.isProMode,
        color = (!pov.color).name,
        challenger = Challenge.toRegistered(pov.game.variant, timeControl)(challenger),
        destUser = dest.some,
        rematchOf = pov.gameId.some,
      )
    }
  }

  def makeTourChallenge(
      tour: lila.tournament.Tournament,
      arr: lila.tournament.Arrangement,
      me: User,
  )(implicit lang: Lang): Fu[Challenge] =
    for {
      opponent <- (arr.opponentUser(me.id).map(_.id) ?? { opp =>
        userRepo.byId(opp)
      }) orFail "Opponent not found"
      denied <- granter(
        me.some,
        opponent,
        tour.perfType,
        (pref: lila.pref.Pref) => pref.tourChallenge,
      )
      _   <- denied.fold(funit)(d => fufail(lila.challenge.ChallengeDenied.translated(d)))
      gid <- idGenerator.game
      myColor     = arr.color.map(c => if (arr.user1.exists(_.id == me.id)) c else !c)
      timeControl = Challenge.TimeControl.make(tour.timeControl.clock, tour.timeControl.days)
      challenge = Challenge.make(
        id = gid,
        variant = tour.variant,
        initialSfen = tour.position,
        timeControl = timeControl,
        mode = tour.mode,
        proMode = tour.proMode,
        color = myColor.map(_.name).getOrElse("random"),
        challenger = Challenge.toRegistered(tour.variant, timeControl)(me),
        destUser = opponent.some,
        tourInfo = Challenge
          .TournamentInfo(
            tournamentId = tour.id,
            arrangementId = arr.id,
            withName = tour.isOrganized,
          )
          .some,
      )
    } yield (challenge)

}
