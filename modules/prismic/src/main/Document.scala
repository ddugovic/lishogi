package lila.prismic

import play.api.libs.functional.syntax._
import play.api.libs.json._

import lila.prismic.Fragment.DocumentLink

case class Document(
    id: String,
    uid: Option[String],
    typ: String,
    href: String,
    tags: Seq[String],
    lang: String,
    alternateLanguages: Seq[Document.AlternateLanguage],
    fragments: Map[String, Fragment],
) extends WithFragments {

  def isTagged(requiredTags: Seq[String]) = requiredTags.forall(tag => tags.contains(tag))

  def asDocumentLink: DocumentLink =
    Fragment.DocumentLink(id, uid, typ, tags, lang, isBroken = false)
}

private[prismic] object Document {

  def parse(jsvalue: JsObject): Option[Fragment] = {
    (jsvalue \ "type")
      .asOpt[String]
      .flatMap {

        case "Image"          => Some(Fragment.Image.reader.map(identity[Fragment]))
        case "Color"          => Some(Fragment.Color.reader.map(identity[Fragment]))
        case "Number"         => Some(Fragment.Number.reader.map(identity[Fragment]))
        case "Date"           => Some(Fragment.Date.reader.map(identity[Fragment]))
        case "Timestamp"      => Some(Fragment.Timestamp.reader.map(identity[Fragment]))
        case "GeoPoint"       => Some(Fragment.GeoPoint.reader.map(identity[Fragment]))
        case "Text"           => Some(Fragment.Text.reader.map(identity[Fragment]))
        case "Select"         => Some(Fragment.Text.reader.map(identity[Fragment]))
        case "Embed"          => Some(Fragment.Embed.reader.map(identity[Fragment]))
        case "Link.web"       => Some(Fragment.WebLink.reader.map(identity[Fragment]))
        case "Link.document"  => Some(Fragment.DocumentLink.reader.map(identity[Fragment]))
        case "Link.file"      => Some(Fragment.MediaLink.reader.map(identity[Fragment]))
        case "StructuredText" => Some(Fragment.StructuredText.reader.map(identity[Fragment]))
        case "Group"          => Some(Fragment.Group.reader.map(identity[Fragment]))

        case _ => None
      }
      .flatMap(_.reads(jsvalue \ "value" get).asOpt)
  }

  implicit def reader: Reads[Document] = (
    (__ \ "id").read[String] and
      (__ \ "uid").readNullable[String] and
      (__ \ "href").read[String] and
      (__ \ "tags").read[Seq[String]] and
      (__ \ "lang").read[String] and
      (__ \ "alternate_languages").readNullable[Seq[AlternateLanguage]].map(_.getOrElse(Nil)) and
      (__ \ "type").read[String].flatMap[(String, Map[String, Fragment])] { typ =>
        (__ \ "data" \ typ)
          .read[JsObject]
          .map { data =>
            collection.immutable.ListMap(
              data.fields
                .map {
                  case (key, json: JsObject) =>
                    parse(json).toList.map(fragment => (s"$typ.$key", fragment))
                  case (key, jsons: JsArray) =>
                    jsons.value.zipWithIndex.collect {
                      case (json: JsObject, i) =>
                        parse(json).toList.map(fragment => (s"$typ.$key[$i]", fragment))
                      case _ => Nil
                    }.flatten
                  case _ => Nil
                }
                .toSeq
                .flatten: _*,
            )
          }
          .map(data => (typ, data))
      }
  )((id, uid, href, tags, lang, alternateLanguages, typAndData) =>
    Document(
      id,
      uid,
      typAndData._1,
      href,
      tags,
      lang,
      alternateLanguages,
      typAndData._2,
    ),
  )

  case class AlternateLanguage(id: String, uid: Option[String], typ: String, lang: String)

  object AlternateLanguage {
    implicit val reader: Reads[AlternateLanguage] = (
      (__ \ "id").read[String] and
        (__ \ "uid").readNullable[String] and
        (__ \ "type").read[String] and
        (__ \ "lang").read[String]
    )(AlternateLanguage.apply _)
  }
}
