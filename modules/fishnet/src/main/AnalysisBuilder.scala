package lila.fishnet

import org.joda.time.DateTime

import shogi.format.usi.Usi

import lila.analyse.Analysis
import lila.analyse.Info
import lila.fishnet.JsonApi.Request.Evaluation
import lila.tree.Eval

final private class AnalysisBuilder(evalCache: FishnetEvalCache)(implicit
    ec: scala.concurrent.ExecutionContext,
) {

  def apply(client: Client, work: Work.Analysis, evals: List[Evaluation.OrSkipped]): Fu[Analysis] =
    partial(client, work, evals map some, isPartial = false)

  def partial(
      client: Client,
      work: Work.Analysis,
      evals: List[Option[Evaluation.OrSkipped]],
      isPartial: Boolean = true,
  ): Fu[Analysis] =
    evalCache.evals(work) flatMap { cachedFull =>
      // remove first eval in partial analysis
      // to prevent the mobile app from thinking it's complete
      // https://github.com/veloce/lichobile/issues/722
      val cached = if (isPartial) cachedFull - 0 else cachedFull
      def debug  = s"${work.game.variant.key} analysis for ${work.game.id} by ${client.fullId}"
      VariationValidation(
        work.game,
        Analysis(
          id = work.game.id,
          studyId = work.game.studyId,
          postGameStudies = work.postGameStudies,
          infos =
            makeInfos(mergeEvalsAndCached(work, evals, cached), work.game.usiList, work.startPly),
          startPly = work.startPly,
          uid = work.sender.userId,
          by = !client.lishogi option client.userId.value,
          date = DateTime.now,
        ),
      ) match {
        case (analysis, errors) =>
          errors foreach { e =>
            logger.debug(s"[Variation validation] $debug $e")
          }
          if (analysis.valid) {
            if (!isPartial && analysis.emptyRatio >= 1d / 10)
              fufail(
                s"${work.game.variant.key} analysis $debug has ${analysis.nbEmptyInfos} empty infos out of ${analysis.infos.size}",
              )
            else fuccess(analysis)
          } else fufail(s"${work.game.variant.key} analysis $debug is empty")
      }
    }

  private def mergeEvalsAndCached(
      work: Work.Analysis,
      evals: List[Option[Evaluation.OrSkipped]],
      cached: Map[Int, Evaluation],
  ): List[Option[Evaluation]] =
    evals.zipWithIndex.map {
      case (None, i)              => cached get i
      case (Some(Right(eval)), i) => cached.getOrElse(i, eval).some
      case (_, i) =>
        cached get i orElse {
          logger.error(s"Missing cached eval for skipped position at index $i in $work")
          none[Evaluation]
        }
    }

  private def makeInfos(
      evals: List[Option[Evaluation]],
      moves: List[Usi],
      startedAtPly: Int,
  ): List[Info] =
    (evals filterNot (_ ?? (_.isCheckmate)) sliding 2).toList.zip(moves).zipWithIndex map {
      case ((List(Some(before), Some(after)), move), index) => {
        val variation = before.cappedPv match {
          case first :: rest if first != move => first :: rest
          case _                              => Nil
        }
        val best = variation.headOption
        val info = Info(
          ply = index + 1 + startedAtPly,
          eval = Eval(
            after.score.cp,
            after.score.mate,
            best,
          ),
          variation = variation.map(_.usi),
        )
        if (info.ply % 2 == 1) info.invert else info
      }
      case ((_, _), index) => Info(index + 1 + startedAtPly, Eval.empty)
    }
}
