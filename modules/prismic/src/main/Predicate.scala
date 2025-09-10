package lila.prismic

import org.joda.time.DateTime

trait QuerySerializer[T] {
  def serialize(value: T): String
}

object QuerySerializer {

  def apply[T](f: T => String) = new QuerySerializer[T] {
    override def serialize(value: T): String = f(value)
  }

  implicit val StringSerializer: QuerySerializer[String] = apply("\"" + _ + "\"")

  implicit val DateSerializer: QuerySerializer[DateTime] = apply(_.getMillis.toString)

  implicit val LongSerializer: QuerySerializer[Long] = apply(_.toString)

  implicit val IntSerializer: QuerySerializer[Int] = apply(_.toString)

  implicit val BigDecimalSerializer: QuerySerializer[BigDecimal] = apply(_.toString)

  implicit def seqSerializer[T](implicit ps: QuerySerializer[T]): QuerySerializer[Seq[T]] =
    new QuerySerializer[Seq[T]] {
      override def serialize(value: Seq[T]): String =
        "[" + value.map(ps.serialize).mkString(",") + "]"
    }

}

sealed trait Predicate {

  def q: String
}

object Predicate {

  import QuerySerializer._

  def apply[T](operator: String, fragment: String, v1: T)(implicit ps: QuerySerializer[T]) =
    new Predicate {
      override def q = s"""[:d = $operator($fragment, ${ps.serialize(v1)})]"""
    }

  def apply[T1, T2](operator: String, fragment: String, v1: T1, v2: T2)(implicit
      ps1: QuerySerializer[T1],
      ps2: QuerySerializer[T2],
  ) = new Predicate {
    override def q = s"""[:d = $operator($fragment, ${ps1.serialize(v1)}, ${ps2.serialize(v2)})]"""
  }

  def apply[T1, T2, T3](operator: String, fragment: String, v1: T1, v2: T2, v3: T3)(implicit
      ps1: QuerySerializer[T1],
      ps2: QuerySerializer[T2],
      ps3: QuerySerializer[T3],
  ) = new Predicate {
    override def q = s"""[:d = $operator($fragment, ${ps1.serialize(v1)}, ${ps2.serialize(
        v2,
      )}, ${ps3.serialize(v3)})]"""
  }

  def at(fragment: String, value: String) = apply("at", fragment, value)

}
