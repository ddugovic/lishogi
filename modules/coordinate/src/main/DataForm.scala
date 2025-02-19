package lila.coordinate

import play.api.data.Forms._
import play.api.data._

object DataForm {

  val color = Form(
    single(
      "color" -> number(min = 1, max = 3),
    ),
  )

  val score = Form(
    mapping(
      "color" -> text.verifying(Set("sente", "gote") contains _),
      "score" -> number(min = 0, max = 100),
    )(ScoreData.apply)(ScoreData.unapply),
  )

  case class ScoreData(color: String, score: Int) {

    def isSente = color == "sente"
  }
}
