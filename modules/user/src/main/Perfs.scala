package lila.user

import org.joda.time.DateTime

import shogi.Speed

import lila.db.BSON
import lila.rating.Glicko
import lila.rating.Perf
import lila.rating.PerfType

case class Perfs(
    standard: Perf,
    minishogi: Perf,
    chushogi: Perf,
    annanshogi: Perf,
    kyotoshogi: Perf,
    checkshogi: Perf,
    ultraBullet: Perf,
    bullet: Perf,
    blitz: Perf,
    rapid: Perf,
    classical: Perf,
    correspondence: Perf,
    puzzle: Perf,
    storm: Perf.Storm,
    aiLevels: Perf.AiLevels,
) {

  def perfs =
    List(
      "standard"       -> standard,
      "minishogi"      -> minishogi,
      "chushogi"       -> chushogi,
      "annanshogi"     -> annanshogi,
      "kyotoshogi"     -> kyotoshogi,
      "checkshogi"     -> checkshogi,
      "ultraBullet"    -> ultraBullet,
      "bullet"         -> bullet,
      "blitz"          -> blitz,
      "rapid"          -> rapid,
      "classical"      -> classical,
      "correspondence" -> correspondence,
      "puzzle"         -> puzzle,
    )

  def bestPerf: Option[(PerfType, Perf)] = {
    val ps = PerfType.nonPuzzle map { pt =>
      pt -> apply(pt)
    }
    val minNb = math.max(1, ps.foldLeft(0)(_ + _._2.nb) / 10)
    ps.foldLeft(none[(PerfType, Perf)]) {
      case (ro, p) if p._2.nb >= minNb =>
        ro.fold(p.some) { r =>
          Some(if (p._2.intRating > r._2.intRating) p else r)
        }
      case (ro, _) => ro
    }
  }

  def bestPerfs(nb: Int): List[(PerfType, Perf)] = {
    val ps = PerfType.nonPuzzle map { pt =>
      pt -> apply(pt)
    }
    val minNb = math.max(1, ps.foldLeft(0)(_ + _._2.nb) / 15)
    ps.filter(p => p._2.nb >= minNb).sortBy(-_._2.intRating) take nb
  }

  def bestPerfType: Option[PerfType] = bestPerf.map(_._1)

  def bestRating: Int = bestRatingIn(PerfType.leaderboardable)

  def bestStandardRating: Int = bestRatingIn(PerfType.standard)

  def bestRatingIn(types: List[PerfType]): Int = {
    val ps = types map apply match {
      case Nil => List(standard)
      case x   => x
    }
    val minNb = ps.foldLeft(0)(_ + _.nb) / 10
    ps.foldLeft(none[Int]) {
      case (ro, p) if p.nb >= minNb =>
        ro.fold(p.intRating.some) { r =>
          Some(if (p.intRating > r) p.intRating else r)
        }
      case (ro, _) => ro
    } | Perf.default.intRating
  }

  def bestRatingInWithMinGames(types: List[PerfType], nbGames: Int): Option[Int] =
    types.map(apply).foldLeft(none[Int]) {
      case (ro, p) if p.nb >= nbGames && ro.fold(true)(_ < p.intRating) => p.intRating.some
      case (ro, _)                                                      => ro
    }

  def bestProgress: Int = bestProgressIn(PerfType.leaderboardable)

  def bestProgressIn(types: List[PerfType]): Int =
    types.foldLeft(0) { case (max, t) =>
      val p = apply(t).progress
      if (p > max) p else max
    }

  lazy val perfsMap: Map[String, Perf] = Map(
    "minishogi"      -> minishogi,
    "chushogi"       -> chushogi,
    "annanshogi"     -> annanshogi,
    "kyotoshogi"     -> kyotoshogi,
    "checkshogi"     -> checkshogi,
    "ultraBullet"    -> ultraBullet,
    "bullet"         -> bullet,
    "blitz"          -> blitz,
    "rapid"          -> rapid,
    "classical"      -> classical,
    "correspondence" -> correspondence,
    "puzzle"         -> puzzle,
  )

  def ratingMap: Map[String, Int] = perfsMap.view.mapValues(_.intRating).toMap

  def ratingOf(pt: String): Option[Int] = perfsMap get pt map (_.intRating)

  def apply(key: String): Option[Perf] = perfsMap get key

  def apply(perfType: PerfType): Perf =
    perfType match {
      case PerfType.Standard       => standard
      case PerfType.Minishogi      => minishogi
      case PerfType.Chushogi       => chushogi
      case PerfType.Annanshogi     => annanshogi
      case PerfType.Kyotoshogi     => kyotoshogi
      case PerfType.Checkshogi     => checkshogi
      case PerfType.UltraBullet    => ultraBullet
      case PerfType.Bullet         => bullet
      case PerfType.Blitz          => blitz
      case PerfType.Rapid          => rapid
      case PerfType.Classical      => classical
      case PerfType.Correspondence => correspondence
      case PerfType.Puzzle         => puzzle
    }

  def inShort =
    perfs map { case (name, perf) =>
      s"$name:${perf.intRating}"
    } mkString ", "

  def updateStandard =
    copy(
      standard = {
        val subs = List(bullet, blitz, rapid, classical, correspondence)
        subs.maxBy(_.latest.fold(0L)(_.getMillis)).latest.fold(standard) { date =>
          val nb = subs.map(_.nb).sum
          val glicko = Glicko(
            rating = subs.map(s => s.glicko.rating * (s.nb / nb.toDouble)).sum,
            deviation = subs.map(s => s.glicko.deviation * (s.nb / nb.toDouble)).sum,
            volatility = subs.map(s => s.glicko.volatility * (s.nb / nb.toDouble)).sum,
          )
          Perf(
            glicko = glicko,
            nb = nb,
            recent = Nil,
            latest = date.some,
          )
        }
      },
    )

  def latest: Option[DateTime] =
    perfsMap.values.flatMap(_.latest).foldLeft(none[DateTime]) {
      case (None, date)                          => date.some
      case (Some(acc), date) if date isAfter acc => date.some
      case (acc, _)                              => acc
    }
}

case object Perfs {

  val default = {
    val p = Perf.default
    Perfs(p, p, p, p, p, p, p, p, p, p, p, p, p, Perf.Storm.default, Perf.AiLevels.default)
  }

  val defaultManaged = {
    val managed       = Perf.defaultManaged
    val managedPuzzle = Perf.defaultManagedPuzzle
    default.copy(
      standard = managed,
      bullet = managed,
      blitz = managed,
      rapid = managed,
      classical = managed,
      correspondence = managed,
      puzzle = managedPuzzle,
    )
  }

  def variantLens(variant: shogi.variant.Variant): Option[Perfs => Perf] =
    variant match {
      case shogi.variant.Standard   => Some(_.standard)
      case shogi.variant.Minishogi  => Some(_.minishogi)
      case shogi.variant.Chushogi   => Some(_.chushogi)
      case shogi.variant.Annanshogi => Some(_.annanshogi)
      case shogi.variant.Kyotoshogi => Some(_.kyotoshogi)
      case shogi.variant.Checkshogi => Some(_.checkshogi)
      case _                        => none
    }

  def speedLens(speed: Speed): Perfs => Perf =
    speed match {
      case Speed.Bullet         => perfs => perfs.bullet
      case Speed.Blitz          => perfs => perfs.blitz
      case Speed.Rapid          => perfs => perfs.rapid
      case Speed.Classical      => perfs => perfs.classical
      case Speed.Correspondence => perfs => perfs.correspondence
      case Speed.UltraBullet    => perfs => perfs.ultraBullet
    }

  val perfsBSONHandler = new BSON[Perfs] {

    implicit def perfHandler: BSON[Perf] = Perf.perfBSONHandler

    def reads(r: BSON.Reader): Perfs = {
      @inline def perf(key: String) = r.getO[Perf](key) getOrElse Perf.default
      Perfs(
        standard = perf("standard"),
        minishogi = perf("minishogi"),
        chushogi = perf("chushogi"),
        annanshogi = perf("annanshogi"),
        kyotoshogi = perf("kyotoshogi"),
        checkshogi = perf("checkshogi"),
        ultraBullet = perf("ultraBullet"),
        bullet = perf("bullet"),
        blitz = perf("blitz"),
        rapid = perf("rapid"),
        classical = perf("classical"),
        correspondence = perf("correspondence"),
        puzzle = perf("puzzle"),
        storm = r.getO[Perf.Storm]("storm") getOrElse Perf.Storm.default,
        aiLevels = r.getO[Perf.AiLevels]("ai") getOrElse Perf.AiLevels.default,
      )
    }

    private def notNew(p: Perf): Option[Perf] = p.nonEmpty option p

    def writes(w: BSON.Writer, o: Perfs) =
      reactivemongo.api.bson.BSONDocument(
        "standard"       -> notNew(o.standard),
        "minishogi"      -> notNew(o.minishogi),
        "chushogi"       -> notNew(o.chushogi),
        "annanshogi"     -> notNew(o.annanshogi),
        "kyotoshogi"     -> notNew(o.kyotoshogi),
        "checkshogi"     -> notNew(o.checkshogi),
        "ultraBullet"    -> notNew(o.ultraBullet),
        "bullet"         -> notNew(o.bullet),
        "blitz"          -> notNew(o.blitz),
        "rapid"          -> notNew(o.rapid),
        "classical"      -> notNew(o.classical),
        "correspondence" -> notNew(o.correspondence),
        "puzzle"         -> notNew(o.puzzle),
        "storm"          -> (o.storm.nonEmpty option o.storm),
        "ai"             -> (o.aiLevels.nonEmpty option o.aiLevels),
      )
  }

  case class Leaderboards(
      ultraBullet: List[User.LightPerf],
      bullet: List[User.LightPerf],
      blitz: List[User.LightPerf],
      rapid: List[User.LightPerf],
      classical: List[User.LightPerf],
      correspondence: List[User.LightPerf],
      minishogi: List[User.LightPerf],
      chushogi: List[User.LightPerf],
      annanshogi: List[User.LightPerf],
      kyotoshogi: List[User.LightPerf],
      checkshogi: List[User.LightPerf],
  )

  val emptyLeaderboards = Leaderboards(Nil, Nil, Nil, Nil, Nil, Nil, Nil, Nil, Nil, Nil, Nil)
}
