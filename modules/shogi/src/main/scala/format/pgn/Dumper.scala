package shogi
package format.pgn

object Dumper {

  def apply(situation: Situation, data: shogi.Move, next: Situation): String = {
    import data._

    ((promotion, piece.role) match {
      case (promotion, role) => {
        // Check whether there is a need to disambiguate:
        //   - can a piece of same role move to/capture on the same square?
        //   - if so, disambiguate, in order or preference, by:
        //       - file and rank - the shogi way
        val candidates = situation.board.pieces collect {
          case (cpos, cpiece) if cpiece == piece && cpos != orig && cpiece.eyes(cpos, dest) => cpos
        } filter { cpos =>
          situation.move(cpos, dest, promotion).isSuccess
        }

        val disambiguation = if (candidates.isEmpty) {
          ""
        } else {
          orig.file + orig.rank
        }
        val promotes = {
          if (!promotion && (List(Pawn, Lance, Knight, Silver, Bishop, Rook) contains piece.role) &&
            ((piece.color.promotableZone contains orig.y) ||
            (piece.color.promotableZone contains dest.y)))
            "="
		      else if (!promotion) ""
          else "+"
        }
        s"${role.pgn}$disambiguation${captures.fold("x", "")}${dest.key}$promotes"
      }
    })
  }

  def apply(data: shogi.Drop, next: Situation): String = {
    data.toUsi.usi
  }

  def apply(data: shogi.Move): String =
    apply(
      data.situationBefore,
      data,
      data.afterWithLastMove situationOf !data.color
    )

  def apply(data: shogi.Drop): String =
    apply(
      data,
      data.afterWithLastMove situationOf !data.color
    )
}
