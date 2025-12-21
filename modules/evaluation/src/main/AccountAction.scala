package lila.evaluation

sealed trait AccountAction {
  val description: String
  val id: Int
  override def toString = description
}

object AccountAction {
  case object MarkEngine extends AccountAction {
    val description: String = "Mark as engine"
    val id                  = 3
  }
  case object Report extends AccountAction {
    val description: String = "Reportable actions"
    val id                  = 2
  }
  case object Nothing extends AccountAction {
    val description: String = "Not suspicious"
    val id                  = 1
  }
}
