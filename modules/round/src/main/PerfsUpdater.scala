package lila.round

import org.goochjs.glicko2._

import shogi.Color

import lila.game.Game
import lila.game.GameRepo
import lila.game.RatingDiffs
import lila.history.HistoryApi
import lila.rating.Glicko
import lila.rating.Perf
import lila.rating.RatingFactors
import lila.rating.RatingRegulator
import lila.rating.{ PerfType => PT }
import lila.user.Perfs
import lila.user.RankingApi
import lila.user.User
import lila.user.UserRepo

final class PerfsUpdater(
    gameRepo: GameRepo,
    userRepo: UserRepo,
    historyApi: HistoryApi,
    rankingApi: RankingApi,
    botFarming: BotFarming,
    ratingFactors: () => RatingFactors,
)(implicit ec: scala.concurrent.ExecutionContext) {

  def save(game: Game, sente: User, gote: User): Fu[Option[RatingDiffs]] =
    botFarming(game) flatMap {
      case true => fuccess(none)
      case _ =>
        (game.rated && game.finished && game.accountable && !sente.lame && !gote.lame) ?? {
          val perfType = game.perfType
          val ratingsW = mkRatings(sente.perfs)
          val ratingsB = mkRatings(gote.perfs)
          val result   = resultOf(game)
          perfType match {
            case PT.Checkshogi =>
              updateRatings(ratingsW.checkshogi, ratingsB.checkshogi, result)
            case PT.Kyotoshogi =>
              updateRatings(ratingsW.kyotoshogi, ratingsB.kyotoshogi, result)
            case PT.Annanshogi =>
              updateRatings(ratingsW.annanshogi, ratingsB.annanshogi, result)
            case PT.Chushogi =>
              updateRatings(ratingsW.chushogi, ratingsB.chushogi, result)
            case PT.Minishogi =>
              updateRatings(ratingsW.minishogi, ratingsB.minishogi, result)
            case PT.Correspondence =>
              updateRatings(ratingsW.correspondence, ratingsB.correspondence, result)
            case PT.RealTime =>
              updateRatings(ratingsW.realTime, ratingsB.realTime, result)
            case _ =>
          }
          val perfsW                      = mkPerfs(ratingsW, sente -> gote, game)
          val perfsB                      = mkPerfs(ratingsB, gote -> sente, game)
          def intRatingLens(perfs: Perfs) = perfs(perfType).glicko.intRating
          val ratingDiffs = Color.Map(
            intRatingLens(perfsW) - intRatingLens(sente.perfs),
            intRatingLens(perfsB) - intRatingLens(gote.perfs),
          )
          gameRepo.setRatingDiffs(game.id, ratingDiffs) zip
            userRepo.setPerfs(sente, perfsW, sente.perfs) zip
            userRepo.setPerfs(gote, perfsB, gote.perfs) zip
            historyApi.add(sente, game, perfsW) zip
            historyApi.add(gote, game, perfsB) zip
            rankingApi.save(sente, perfType, perfsW(perfType)) zip
            rankingApi.save(gote, perfType, perfsB(perfType)) inject ratingDiffs.some
        }
    }

  private case class Ratings(
      minishogi: Rating,
      chushogi: Rating,
      annanshogi: Rating,
      kyotoshogi: Rating,
      checkshogi: Rating,
      realTime: Rating,
      correspondence: Rating,
  )

  private def mkRatings(perfs: Perfs) =
    Ratings(
      minishogi = perfs.minishogi.toRating,
      chushogi = perfs.chushogi.toRating,
      annanshogi = perfs.annanshogi.toRating,
      kyotoshogi = perfs.kyotoshogi.toRating,
      checkshogi = perfs.checkshogi.toRating,
      realTime = perfs.realTime.toRating,
      correspondence = perfs.correspondence.toRating,
    )

  private def resultOf(game: Game): Glicko.Result =
    game.winnerColor match {
      case Some(shogi.Sente) => Glicko.Result.Win
      case Some(shogi.Gote)  => Glicko.Result.Loss
      case None              => Glicko.Result.Draw
    }

  private def updateRatings(sente: Rating, gote: Rating, result: Glicko.Result): Unit =
    if (result != Glicko.Result.Draw) {
      val results = new RatingPeriodResults()
      result match {
        case Glicko.Result.Win  => results.addResult(sente, gote)
        case Glicko.Result.Loss => results.addResult(gote, sente)
        case _                  =>
      }
      try {
        Glicko.system.updateRatings(results, true)
      } catch {
        case e: Exception => logger.error("update ratings", e)
      }
    }

  private def mkPerfs(ratings: Ratings, users: (User, User), game: Game): Perfs =
    users match {
      case (player, opponent) =>
        val perfs            = player.perfs
        val isStd            = game.variant.standard
        val isHumanVsMachine = player.noBot && opponent.isBot
        def addRatingIf(cond: Boolean, perf: Perf, rating: Rating) =
          if (cond) {
            val p = perf.addOrReset(_.round.error.glicko, s"game ${game.id}")(rating, game.movedAt)
            if (isHumanVsMachine) p averageGlicko perf // halve rating diffs for human
            else p
          } else perf
        val perfs1 = perfs.copy(
          minishogi = addRatingIf(game.variant.minishogi, perfs.minishogi, ratings.minishogi),
          chushogi = addRatingIf(game.variant.chushogi, perfs.chushogi, ratings.chushogi),
          annanshogi = addRatingIf(game.variant.annanshogi, perfs.annanshogi, ratings.annanshogi),
          kyotoshogi = addRatingIf(game.variant.kyotoshogi, perfs.kyotoshogi, ratings.kyotoshogi),
          checkshogi = addRatingIf(game.variant.checkshogi, perfs.checkshogi, ratings.checkshogi),
          realTime = addRatingIf(isStd && game.hasClock, perfs.realTime, ratings.realTime),
          correspondence = addRatingIf(
            isStd && game.isCorrespondence,
            perfs.correspondence,
            ratings.correspondence,
          ),
        )
        val r = RatingRegulator(ratingFactors()) _
        perfs1.copy(
          minishogi = r(PT.Minishogi, perfs.minishogi, perfs1.minishogi),
          chushogi = r(PT.Chushogi, perfs.chushogi, perfs1.chushogi),
          annanshogi = r(PT.Annanshogi, perfs.annanshogi, perfs1.annanshogi),
          kyotoshogi = r(PT.Kyotoshogi, perfs.kyotoshogi, perfs1.kyotoshogi),
          checkshogi = r(PT.Checkshogi, perfs.checkshogi, perfs1.checkshogi),
          realTime = r(PT.RealTime, perfs.realTime, perfs1.realTime),
          correspondence = r(PT.Correspondence, perfs.correspondence, perfs1.correspondence),
        )
    }
}
