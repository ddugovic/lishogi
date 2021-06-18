package lila.game

import java.security.MessageDigest
import lila.db.ByteArray

private[game] case class Metadata(
    source: Option[Source],
    kifImport: Option[KifImport],
    tournamentId: Option[String],
    swissId: Option[String],
    simulId: Option[String],
    analysed: Boolean
) {

  def kifDate = kifImport flatMap (_.date)

  def kifUser = kifImport flatMap (_.user)

  def isEmpty = this == Metadata.empty
}

private[game] object Metadata {

  val empty = Metadata(None, None, None, None, None, false)
}

case class KifImport(
    user: Option[String],
    date: Option[String],
    kif: String,
    // hashed KIF for DB unicity
    h: Option[ByteArray]
)

object KifImport {

  def hash(kif: String) =
    ByteArray {
      MessageDigest getInstance "MD5" digest {
        kif.linesIterator
          .map(_.replace(" ", ""))
          .filter(_.nonEmpty)
          .to(List)
          .mkString("\n")
          .getBytes("UTF-8")
      } take 12
    }

  def make(
      user: Option[String],
      date: Option[String],
      kif: String
  ) =
    KifImport(
      user = user,
      date = date,
      kif = kif,
      h = hash(kif).some
    )

  import reactivemongo.api.bson.Macros
  import ByteArray.ByteArrayBSONHandler
  implicit val kifImportBSONHandler = Macros.handler[KifImport]
}
