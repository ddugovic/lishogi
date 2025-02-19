#!/usr/bin/env ruby

require 'fileutils'
require 'base64'
include FileUtils

lila_dir = File.dirname(`pnpm root -w`.strip)
source_dir = lila_dir + '/public/piece/'
dest_dir = lila_dir + '/public/piece-css/'

Dir.mkdir(dest_dir) unless Dir.exist?(dest_dir)

bidirectional = [
  ['shogi_BnW', 'svg'],
  ['Engraved_cz_BnW', 'svg'],
  ['joyful', 'png'],
  ['characters', 'png'],
  ['Firi', 'svg'],
]

themes = [
  ['1Kanji_3D', 'svg'],
  ['2Kanji_3D', 'svg'],
  ['doubutsu', 'svg'],
  ['international', 'svg'],
  ['Intl_Colored_2D', 'svg'],
  ['Intl_Colored_3D', 'svg'],
  ['Intl_Shadowed', 'svg'],
  ['Intl_Monochrome_2D', 'svg'],
  ['Intl_Wooden_3D', 'svg'],
  ['Intl_Portella', 'png'],
  ['kanji_brown', 'svg'],
  ['kanji_light', 'svg'],
  ['Kanji_Guide_Shadowed', 'svg'],
  ['kanji_red_wood', 'svg'],
  ['orangain', 'svg'],
  ['simple_kanji', 'svg'],
  ['Vald_opt', 'svg'],
  ['Valdivia', 'svg'],
  ['Logy_Games', 'svg'],
  ['Shogi_cz', 'svg'],
  ['Ryoko_1Kanji', 'svg'],
  ['Shogi_FCZ', 'svg'],
  ['Portella', 'png'],
  ['Portella_2Kanji', 'png'],
  ['western', 'svg'],
  ['Engraved_cz', 'svg'],
  ['pixel', 'png'],
]
types = {
  'svg' => 'svg+xml;base64,',
  'png' => 'png;base64,'
}
roles = ['FU', 'GI', 'GY', 'HI', 'KA', 'KE', 'KI', 'KY', 'NG', 'NK', 'NY', 'OU', 'RY', 'TO', 'UM']
colors = ['sente', 'gote']

stanRoles = {
  'FU' => 'pawn',
  'GI' => 'silver',
  'GY' => 'tama',
  'HI' => 'rook',
  'KA' => 'bishop',
  'KE' => 'knight',
  'KI' => 'gold',
  'KY' => 'lance',
  'NG' => 'promotedsilver',
  'NK' => 'promotedknight',
  'NY' => 'promotedlance',
  'OU' => 'king',
  'RY' => 'dragon',
  'TO' => 'tokin',
  'UM' => 'horse'
}

def classesWithOrientation(color, role, flipped)
  if flipped
    if color == 'sente'
      ".sg-wrap.orientation-gote piece.#{role}.gote,
      .hand-bottom piece.#{role}.gote,
      .spare-bottom piece.#{role}.gote"
    else
      ".sg-wrap.orientation-gote piece.#{role}.sente,
      .hand-top piece.#{role}.sente,
      .spare-top piece.#{role}.sente"
    end
  else
    if color == 'sente'
      "piece.#{role}.sente,
      .sg-wrap.orientation-sente piece.#{role}.sente,
      .hand-bottom piece.#{role}.sente,
      .spare-bottom piece.#{role}.sente"
    else
      "piece.#{role}.gote,
      .sg-wrap.orientation-sente piece.#{role}.gote,
      .hand-top piece.#{role}.gote,
      .spare-top piece.#{role}.gote"
    end
  end
end

def classes(color, role)
  if color == 'sente' # facing up
    if role == 'king'
      ".sg-wrap.orientation-gote piece.king.gote,
      .spare-bottom piece.king.gote"
    elsif role == 'tama'
      "piece.king.sente,
      .sg-wrap.orientation-sente piece.king.sente"
    else
      "piece.#{role}.sente,
      .sg-wrap.orientation-sente piece.#{role}.sente,
      .sg-wrap.orientation-gote piece.#{role}.gote,
      .hand-bottom piece.#{role}.gote,
      .spare-bottom piece.#{role}.gote"
    end
  else # facing down
    if role == 'king'
      "piece.king.gote,
      .sg-wrap.orientation-sente piece.king.gote"
    elsif role == 'tama'
      ".sg-wrap.orientation-gote piece.king.sente,
      .spare-top piece.king.sente"
    else
      "piece.#{role}.gote,
      .sg-wrap.orientation-sente piece.#{role}.gote,
      .sg-wrap.orientation-gote piece.#{role}.sente,
      .hand-top piece.#{role},
      .spare-top piece.#{role}.sente"
    end
  end
end

# inline SVG
themes.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = colors.map { |color|
    roles.map { |role|
      piece = (color == 'sente' ? '0' : '1') + role
      file = source_dir + name + '/' + piece + '.' + ext
      File.open(file, 'r') do|image_file|
        image = image_file.read
        base64 = Base64.strict_encode64(image)
        cls = classes(color, stanRoles[role])
        cls + ' {' +
          "background-image:url('data:image/" + types[ext] + base64 + "')}"
      end
    }
  }.flatten
  if name == 'pixel'
    classes.append("piece { image-rendering: pixelated; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { image-rendering: unset; }")
  end
  if ext == 'png'
    classes.append("piece { will-change: transform; background-repeat: unset; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  classes.append(".v-chushogi piece, .v-kyotoshogi piece { background-image: none !important; } ")
  File.open(dest_dir + name + '.css', 'w') { |f| f.puts classes.join("\n") }
}
bidirectional.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = ['-1', ''].map { |up|
    colors.map { |color|
      roles.map { |role|
        piece = (color == 'sente' ? '0' : '1') + role + up
        file = source_dir + name + '/' + piece + '.' + ext
        File.open(file, 'r') do|image_file|
          image = image_file.read
          base64 = Base64.strict_encode64(image)
          cls = classesWithOrientation(color, stanRoles[role], up.length != 0)
          cls + ' {' +
            "background-image:url('data:image/" + types[ext] + base64 + "')}"
        end
      }
    }
  }.flatten
  if name == 'pixel'
    classes.append("piece { image-rendering: pixelated; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { image-rendering: unset; }")
  end
  if name == 'characters'
    classes.append("piece { background-size: contain; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { background-size: cover; }")
  end
  if ext == 'png'
    classes.append("piece { will-change: transform; background-repeat: unset; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  classes.append(".v-chushogi piece, .v-kyotoshogi piece { background-image: none !important; } ")
  File.open(dest_dir + name + '.css', 'w') { |f| f.puts classes.join("\n") }
}

# external SVG
themes.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = colors.map { |color|
    roles.map { |role|
      piece = (color == 'sente' ? '0' : '1') + role
      cls = classes(color, stanRoles[role])
      cls + ' {' +
        "background-image:url('/assets/piece/" + name + "/" + piece + "." + ext + "')}"
    }
  }.flatten
  if name == 'pixel'
    classes.append("piece { image-rendering: pixelated; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { image-rendering: unset; }")
  end
  if ext == 'png'
    classes.append("piece { will-change: transform; background-repeat: unset; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  classes.append(".v-chushogi piece, .v-kyotoshogi piece { background-image: none !important; } ")
  File.open(dest_dir + name + '.external.css', 'w') { |f| f.puts classes.join("\n") }
}
bidirectional.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = ['-1', ''].map { |up|
    colors.map { |color|
      roles.map { |role|
        piece = (color == 'sente' ? '0' : '1') + role + up
        cls = classesWithOrientation(color, stanRoles[role], up.length != 0)
        cls + ' {' +
          "background-image:url('/assets/piece/" + name + "/" + piece + "." + ext + "')}"     
      }
    }
  }.flatten
  if name == 'pixel'
    classes.append("piece { image-rendering: pixelated; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { image-rendering: unset; }")
  end
  if name == 'characters'
    classes.append("piece { background-size: contain; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { background-size: cover; }")
  end
  if ext == 'png'
    classes.append("piece { will-change: transform; background-repeat: unset; }")
    classes.append(".v-chushogi piece, .v-kyotoshogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  classes.append(".v-chushogi piece, .v-kyotoshogi piece { background-image: none !important; } ")
  File.open(dest_dir + name + '.external.css', 'w') { |f| f.puts classes.join("\n") }
}
