package shogi
package format.pgn

class ReaderTest extends ChessTest {

  import Fixtures._
  import Reader.Result._

  "only raw moves" should {
    "many games" in {
      forall(raws) { (c: String) =>
        Reader.full(c) must beSuccess.like {
          case Complete(replay) => replay.moves must have size (c.split(' ').size)
        }
      }
    }
    "example from prod 1" in {
      Reader.full(fromProd1) must beSuccess
    }
    "example from prod 2" in {
      Reader.full(fromProd2) must beSuccess
    }
    "rook promotion" in {
      Reader.full(promoteRook) must beSuccess
    }
    "and delimiters" in {
      Reader.full(withDelimiters) must beSuccess.like {
        case Complete(replay) => replay.moves must have size 33
      }
    }
    "and delimiters on new lines" in {
      Reader.full(withDelimitersOnNewLines) must beSuccess.like {
        case Complete(replay) => replay.moves must have size 33
      }
    }
  }
  "from prod" in {
    "from position close shogi" in {
      Reader.full(fromPosProdCloseChess) must beSuccess.like {
        case Complete(replay) => replay.chronoMoves.size must_== 152
      }
    }
    "from position empty SFEN" in {
      Reader.full(fromPositionEmptyFen) must beSuccess.like {
        case Complete(replay) => replay.chronoMoves.size must_== 164
      }
    }
    "preserves initial ply" in {
      Reader.full(caissa) must beSuccess.like {
        case Complete(replay) =>
          replay.setup.startedAtTurn must_== 43
          replay.state.startedAtTurn must_== 43
      }
    }
  }
}
