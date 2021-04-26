package shogi

import format.Usi

case class Drop(
    piece: Piece,
    pos: Pos,
    situationBefore: Situation,
    after: Board,
    metrics: MoveMetrics = MoveMetrics()
) {

  def before = situationBefore.board

  def situationAfter = Situation(finalizeAfter, !piece.color)

  def withHistory(h: History) = copy(after = after withHistory h)

  def finalizeAfter: Board = {
    val board = after.variant.finalizeBoard(
      after updateHistory { h =>
        h.copy(
          lastMove = Some(Usi.Drop(piece.role, pos)),
          halfMoveClock = if (piece is Pawn) 0 else h.halfMoveClock + 1
        )
      },
      toUsi,
      none,
      !situationBefore.color
    )

    board updateHistory {
      _.copy(positionHashes = Hash(Situation(board, !piece.color)) ++ board.history.positionHashes)
    }
  }

  def afterWithLastMove =
    after.variant.finalizeBoard(
      after.copy(history = after.history.withLastMove(toUsi)),
      toUsi,
      none,
      !situationBefore.color
    )

  def color = piece.color

  def withAfter(newBoard: Board) = copy(after = newBoard)

  def withMetrics(m: MoveMetrics) = copy(metrics = m)

  def toUsi = Usi.Drop(piece.role, pos)

  override def toString = toUsi.usi
}
