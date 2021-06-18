package lila.game

import shogi.format.Uci
import shogi.{ variant => _, ToOptionOpsFromOption => _, _ }
import shogi.variant.{ Standard }
import lila.db.ByteArray

sealed trait KifStorage

private object KifStorage {

  case object OldBin extends KifStorage {

    def encode(kifMoves: KifMoves) = {
      ByteArray {
        monitor(_.game.kif.encode("old")) {
          format.kif.Binary.writeMoves(kifMoves).get
        }
      }
    }

    def decode(bytes: ByteArray, plies: Int): KifMoves = {
      monitor(_.game.kif.decode("old")) {
        format.kif.Binary.readMoves(bytes.value.toList, plies).get.toVector
      }
    }
  }

  // case object Huffman extends KifStorage {
  //
  //   import org.lishogi.compression.game.{
  //     Encoder,
  //     Square => JavaSquare,
  //     Piece => JavaPiece,
  //     Role => JavaRole
  //   }
  //   import scala.jdk.CollectionConverters._
  // // KifMoves - Vector[String]
  //   def encode(kifMoves: KifMoves) = {
  //     ByteArray {
  //       monitor(_.game.kif.encode("huffman")) {
  //         Encoder.encode(kifMoves.toArray)
  //       }
  //     }
  //   }
  //   def decode(bytes: ByteArray, plies: Int): Decoded =
  //     monitor(_.game.kif.decode("huffman")) {
  //       val decoded      = Encoder.decode(bytes.value, plies)
  //       Decoded(
  //         kifMoves = decoded.kifMoves.toVector,
  //         pieces = Standard.pieces,
  //         checkCount = List(0, 0),
  //         positionHashes = decoded.positionHashes,
  //         lastMove = Option(decoded.lastUci) flatMap Uci.apply,
  //         halfMoveClock = decoded.halfMoveClock
  //       )
  //     }
  //
  //   private def shogiPos(sq: Integer): Option[Pos] =
  //     Pos.posAt(JavaSquare.file(sq) + 1, JavaSquare.rank(sq) + 1)
  //   private def shogiRole(role: JavaRole): Role =
  //     role match {
  //       case JavaRole.PAWN   => Pawn
  //       case JavaRole.KNIGHT => Knight
  //       case JavaRole.BISHOP => Bishop
  //       case JavaRole.ROOK   => Rook
  //       case JavaRole.KING   => King
  //       case _ => Lance
  //     }
  //   private def shogiPiece(piece: JavaPiece): Piece = Piece(Color(piece.sente), shogiRole(piece.role))
  // }

  case class Decoded(
      kifMoves: KifMoves,
      pieces: PieceMap,
      positionHashes: PositionHash, // irrelevant after game ends
      checkCount: List[Int],
      lastMove: Option[Uci],
      hands: Option[Hands],
  )

  private def monitor[A](mon: lila.mon.TimerPath)(f: => A): A =
    lila.common.Chronometer.syncMon(mon)(f)
}
