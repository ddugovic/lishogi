package shogi
package format.pgn
import variant.Standard

class ParserTest extends ChessTest {

  import Fixtures._

  val parser                 = Parser.full _
  def parseMove(str: String) = Parser.MoveParser(str, Standard)

  "promotion check" should {
    "as a queen" in {
      parser("b8=Q ") must beSuccess.like {
        case a =>
          a.sans.value.headOption must beSome.like {
            case san: Std => san.promotion must_== Some(Queen)
          }
      }
    }
    "as a rook" in {
      parser("b8=R ") must beSuccess.like {
        case a =>
          a.sans.value.headOption must beSome.like {
            case san: Std => san.promotion must_== Some(Rook)
          }
      }
    }
  }

  "result" in {
    "no tag but inline result" in {
      parser(noTagButResult) must beSuccess.like {
        case parsed => parsed.tags("Result") must_== Some("1-0")
      }
    }
    "in tags" in {
      parser(whiteResignsInTags) must beSuccess.like {
        case parsed => parsed.tags("Result") must_== Some("0-1")
      }
    }
    "in moves" in {
      parser(whiteResignsInMoves) must beSuccess.like {
        case parsed => parsed.tags("Result") must_== Some("0-1")
      }
    }
    "in tags and moves" in {
      parser(whiteResignsInTagsAndMoves) must beSuccess.like {
        case parsed => parsed.tags("Result") must_== Some("0-1")
      }
    }
  }

  "glyphs" in {
    parseMove("e4") must beSuccess.like {
      case a => a must_== Std(Pos.E4, Pawn)
    }
    parseMove("e4!") must beSuccess.like {
      case a: Std =>
        a.dest === Pos.E4
        a.role === Pawn
        a.metas.glyphs === Glyphs(Glyph.MoveAssessment.good.some, None, Nil)
    }
    parseMove("Ne7g6+?!") must beSuccess.like {
      case a: Std =>
        a.dest === Pos.G6
        a.role === Knight
        a.metas.glyphs === Glyphs(Glyph.MoveAssessment.dubious.some, None, Nil)
    }
    parser("Ne7g6+!") must beSuccess
    parseMove("P@e4?!") must beSuccess.like {
      case a: Drop =>
        a.pos === Pos.E4
        a.role === Pawn
        a.metas.glyphs === Glyphs(Glyph.MoveAssessment.dubious.some, None, Nil)
    }
  }

  "nags" in {
    parser(withNag) must beSuccess

    parser("Ne7g6+! $13") must beSuccess.like {
      case ParsedPgn(_, _, Sans(List(san))) =>
        san.metas.glyphs.move must_== Some(Glyph.MoveAssessment.good)
        san.metas.glyphs.position must_== Some(Glyph.PositionAssessment.unclear)
    }
  }

  "comments" in {
    parser("Ne7g6+! {such a neat comment}") must beSuccess.like {
      case ParsedPgn(_, _, Sans(List(san))) =>
        san.metas.comments must_== List("such a neat comment")
    }
  }

  "variations" in {
    parser("Ne7g6+! {such a neat comment} (e4 Ng6)") must beSuccess.like {
      case ParsedPgn(_, _, Sans(List(san))) =>
        san.metas.variations.headOption must beSome.like {
          case variation => variation.value must haveSize(2)
        }
    }
  }

  "first move variation" in {
    parser("1. e4 (1. d4)") must beSuccess.like {
      case ParsedPgn(_, _, Sans(List(san))) =>
        san.metas.variations.headOption must beSome.like {
          case variation => variation.value must haveSize(1)
        }
    }
  }

  raws foreach { sans =>
    val size = sans.split(' ').size
    "sans only size: " + size in {
      parser(sans) must beSuccess.like {
        case a => a.sans.value.size must_== size
      }
    }
  }

  "disambiguated" in {
    parser(disambiguated) must beSuccess.like {
      case a => a.sans.value.size must_== 3
    }
  }

  "variations" in {
    parser(variations) must beSuccess.like {
      case a => a.sans.value.size must_== 20
    }
  }

  "inline tags" in {
    parser(inlineTags) must beSuccess.like {
      case a =>
        a.tags.value must contain { (tag: Tag) =>
          tag.name == Tag.White && tag.value == "Blazquez, Denis"
        }
    }
  }

  "tag with nested quotes" in {
    parser("""[Black "Schwarzenegger, Arnold \"The Terminator\""]""") must beSuccess.like {
      case a =>
        a.tags.value must contain { (tag: Tag) =>
          tag.name == Tag.Black && tag.value == """Schwarzenegger, Arnold "The Terminator""""
        }
    }
  }

  "tag with inner brackets" in {
    parser("""[Black "[=0040.34h5a4]"]""") must beSuccess.like {
      case a =>
        a.tags.value must contain { (tag: Tag) =>
          tag.name == Tag.Black && tag.value == "[=0040.34h5a4]"
        }
    }
  }

  "en passant e.p. notation" in {
    parser(enpassantEP) must beSuccess.like {
      case a => a.sans.value.size must_== 36
    }
    parser(enpassantEP2) must beSuccess.like {
      case a => a.sans.value.size must_== 36
    }
  }

  "year" in {
    "full date" in {
      parser(recentChessCom) must beSuccess.like {
        case parsed => parsed.tags.year must_== Some(2016)
      }
    }
    "only year" in {
      parser(explorerPartialDate) must beSuccess.like {
        case parsed => parsed.tags.year must_== Some(1978)
      }
    }
  }
}
