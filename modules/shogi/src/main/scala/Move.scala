package shogi

import format.Usi

case class Move(
    piece: Piece,
    orig: Pos,
    dest: Pos,
    situationBefore: Situation,
    after: Board,
    capture: Option[Pos],
    promotion: Boolean,
    metrics: MoveMetrics = MoveMetrics()
) {
  def before = situationBefore.board

  def situationAfter = Situation(finalizeAfter, !piece.color)

  def withHistory(h: History) = copy(after = after withHistory h)

  def finalizeAfter: Board = {
    val board = after updateHistory { h1 =>
      h1.copy(
        lastMove = Some(toUsi),
        halfMoveClock =
          if ((piece is Pawn) || captures || promotes) 0
          else h1.halfMoveClock + 1
      )
    }

    board.variant.finalizeBoard(board, toUsi, capture flatMap before.apply, !situationBefore.color) updateHistory { h =>
      // Update position hashes last, only after updating the board.
      h.copy(positionHashes = Hash(Situation(board, !piece.color)) ++ h.positionHashes
      )
    }
  }

  def afterWithLastMove =
    after.variant.finalizeBoard(
      after.copy(history = after.history.withLastMove(toUsi)),
      toUsi,
      capture flatMap before.apply,
      !situationBefore.color
    )

  // does this move capture an opponent piece?
  def captures = capture.isDefined

  def promotes = promotion

  def color = piece.color

  def withPromotion(op: Option[PromotableRole], promoting: Boolean): Option[Move] =
    if(!promoting)
      this.some
    else {
      op.fold(this.some) { p =>
        for {
          b2 <- after take dest
          b3 <- b2.place(color - p, dest)
        } yield copy(after = b3, promotion = true)
      }
    }

  def withAfter(newBoard: Board) = copy(after = newBoard)

  def withMetrics(m: MoveMetrics) = copy(metrics = m)

  def toUsi = {
    Usi.Move(orig, dest, promotion)
  }

  override def toString = s"$piece ${toUsi.usi}"
}
