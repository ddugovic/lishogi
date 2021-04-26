package shogi

import shogi.format.pgn.San
import shogi.format.{ SFEN, Forsyth, Usi }
import format.pgn.{ Parser, Reader, Tag, Tags }
import scalaz.Validation.FlatMap._
import scalaz.Validation.{ failureNel, success }

case class Replay(setup: Game, moves: List[MoveOrDrop], state: Game) {

  lazy val chronoMoves = moves.reverse

  def addMove(moveOrDrop: MoveOrDrop) =
    copy(
      moves = moveOrDrop :: moves,
      state = moveOrDrop.fold(state.apply, state.applyDrop)
    )

  def moveAtPly(ply: Int): Option[MoveOrDrop] =
    chronoMoves lift (ply - 1 - setup.startedAtTurn)
}

object Replay {

  def apply(game: Game) = new Replay(game, Nil, game)

  def apply(
      moveStrs: Iterable[String],
      initialFen: Option[String],
      variant: shogi.variant.Variant
  ): Valid[Reader.Result] =
    moveStrs.some.filter(_.nonEmpty) toValid "[replay] pgn is empty" flatMap { nonEmptyMoves =>
      Reader.moves(
        nonEmptyMoves,
        Tags(
          List(
            initialFen map { fen =>
              Tag(_.SFEN, fen)
            },
            variant.some.filterNot(_.standard) map { v =>
              Tag(_.Variant, v.name)
            }
          ).flatten
        )
      )
    }

  private def recursiveGames(game: Game, sans: List[San]): Valid[List[Game]] =
    sans match {
      case Nil => success(Nil)
      case san :: rest =>
        san(game.situation) flatMap { moveOrDrop =>
          val newGame = moveOrDrop.fold(game.apply, game.applyDrop)
          recursiveGames(newGame, rest) map { newGame :: _ }
        }
    }

  def games(
      moveStrs: Iterable[String],
      initialFen: Option[String],
      variant: shogi.variant.Variant
  ): Valid[List[Game]] =
    Parser.moves(moveStrs, variant) flatMap { moves =>
      val game = makeGame(variant, initialFen)
      recursiveGames(game, moves.value) map { game :: _ }
    }

  type ErrorMessage = String
  def gameMoveWhileValid(
      moveStrs: Seq[String],
      initialFen: String,
      variant: shogi.variant.Variant
  ): (Game, List[(Game, Usi.WithSan)], Option[ErrorMessage]) = {
    def mk(g: Game, moves: List[(San, String)]): (List[(Game, Usi.WithSan)], Option[ErrorMessage]) = {
      moves match {
        case (san, sanStr) :: rest =>
          san(g.situation).fold(
            err => (Nil, err.head.some),
            moveOrDrop => {
              val newGame = moveOrDrop.fold(g.apply, g.applyDrop)
              val usi     = moveOrDrop.fold(_.toUsi, _.toUsi)
              mk(newGame, rest) match {
                case (next, msg) => ((newGame, Usi.WithSan(usi, sanStr)) :: next, msg)
              }
            }
          )
        case _ => (Nil, None)
      }
    }
    val init = makeGame(variant, initialFen.some)
    Parser
      .moves(moveStrs, variant)
      .fold(
        err => List.empty[(Game, Usi.WithSan)] -> err.head.some,
        moves => mk(init, moves.value zip moveStrs)
      ) match {
      case (games, err) => (init, games, err)
    }
  }

  private def recursiveSituations(sit: Situation, sans: List[San]): Valid[List[Situation]] =
    sans match {
      case Nil => success(Nil)
      case san :: rest =>
        san(sit) flatMap { moveOrDrop =>
          val after = Situation(moveOrDrop.fold(_.afterWithLastMove, _.afterWithLastMove), !sit.color)
          recursiveSituations(after, rest) map { after :: _ }
        }
    }

  private def recursiveSituationsFromUsi(sit: Situation, usis: List[Usi]): Valid[List[Situation]] =
    usis match {
      case Nil => success(Nil)
      case usi :: rest =>
        usi(sit) flatMap { moveOrDrop =>
          val after = Situation(moveOrDrop.fold(_.afterWithLastMove, _.afterWithLastMove), !sit.color)
          recursiveSituationsFromUsi(after, rest) map { after :: _ }
        }
    }

  private def recursiveReplayFromUsi(replay: Replay, usis: List[Usi]): Valid[Replay] =
    usis match {
      case Nil => success(replay)
      case usi :: rest =>
        usi(replay.state.situation) flatMap { moveOrDrop =>
          recursiveReplayFromUsi(replay addMove moveOrDrop, rest)
        }
    }

  private def initialFenToSituation(initialFen: Option[SFEN], variant: shogi.variant.Variant): Situation = {
    initialFen.flatMap { fen =>
      Forsyth << fen.value
    } | Situation(shogi.variant.Standard)
  } withVariant variant

  def boards(
      moveStrs: Iterable[String],
      initialFen: Option[SFEN],
      variant: shogi.variant.Variant
  ): Valid[List[Board]] = situations(moveStrs, initialFen, variant) map (_ map (_.board))

  def situations(
      moveStrs: Iterable[String],
      initialFen: Option[SFEN],
      variant: shogi.variant.Variant
  ): Valid[List[Situation]] = {
    val sit = initialFenToSituation(initialFen, variant)
    Parser.moves(moveStrs, sit.board.variant) flatMap { moves =>
      recursiveSituations(sit, moves.value) map { sit :: _ }
    }
  }

  def boardsFromUsi(
      moves: List[Usi],
      initialFen: Option[SFEN],
      variant: shogi.variant.Variant
  ): Valid[List[Board]] = situationsFromUsi(moves, initialFen, variant) map (_ map (_.board))

  def situationsFromUsi(
      moves: List[Usi],
      initialFen: Option[SFEN],
      variant: shogi.variant.Variant
  ): Valid[List[Situation]] = {
    val sit = initialFenToSituation(initialFen, variant)
    recursiveSituationsFromUsi(sit, moves) map { sit :: _ }
  }

  def apply(
      moves: List[Usi],
      initialFen: Option[String],
      variant: shogi.variant.Variant
  ): Valid[Replay] =
    recursiveReplayFromUsi(Replay(makeGame(variant, initialFen)), moves)

  def plyAtFen(
      moveStrs: Iterable[String],
      initialFen: Option[String],
      variant: shogi.variant.Variant,
      atFen: String
  ): Valid[Int] =
    if (Forsyth.<<@(variant, atFen).isEmpty) failureNel(s"Invalid SFEN $atFen")
    else {

      // we don't want to compare the full move number, to match transpositions
      def truncateFen(fen: String) = fen.split(' ').take(4) mkString " "
      val atFenTruncated           = truncateFen(atFen)
      def compareFen(fen: String)  = truncateFen(fen) == atFenTruncated

      def recursivePlyAtFen(sit: Situation, sans: List[San], ply: Int): Valid[Int] =
        sans match {
          case Nil => failureNel(s"Can't find $atFenTruncated, reached ply $ply")
          case san :: rest =>
            san(sit) flatMap { moveOrDrop =>
              val after = moveOrDrop.fold(_.finalizeAfter, _.finalizeAfter)
              val fen   = Forsyth >> Game(Situation(after, Color.fromPly(ply)), turns = ply)
              if (compareFen(fen)) scalaz.Success(ply)
              else recursivePlyAtFen(Situation(after, !sit.color), rest, ply + 1)
            }
        }

      val sit = initialFen.flatMap {
        Forsyth.<<@(variant, _)
      } | Situation(variant)

      Parser.moves(moveStrs, sit.board.variant) flatMap { moves =>
        recursivePlyAtFen(sit, moves.value, 1)
      }
    }

  private def makeGame(variant: shogi.variant.Variant, initialFen: Option[String]): Game = {
    val g = Game(variant.some, initialFen)
    g.copy(startedAtTurn = g.turns)
  }
}
