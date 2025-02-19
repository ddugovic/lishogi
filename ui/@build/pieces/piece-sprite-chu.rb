#!/usr/bin/env ruby

require 'fileutils'
require 'base64'
include FileUtils

lila_dir = File.dirname(`pnpm root -w`.strip)
source_dir = lila_dir + '/public/piece/'
dest_dir = lila_dir + '/public/piece-css/'

bidirectional = [
  ['Chu_Mnemonic', 'svg'],
  ['Chu_Intl_BnW', 'svg'],
  ['Chu_Firi', 'svg'],
]

themes = [
  ['Chu_Ryoko_1Kanji', 'svg'],
  ['Chu_Intl', 'svg'],
  ['Chu_Eigetsu_Gyoryu', 'png'],
  ['Chu_FCZ', 'svg'],
]
types = {
  'svg' => 'svg+xml;base64,',
  'png' => 'png;base64,'
}
roles = [
  'lance',
  'leopard',
  'copper',
  'silver',
  'gold',
  'elephant',
  'chariot',
  'bishop',
  'tiger',
  'phoenix',
  'kirin',
  'sidemover',
  'verticalmover',
  'rook',
  'horse',
  'dragon',
  'queen',
  'lion',
  'pawn',
  'gobetween',
  'king',
  'tama',
  'promotedpawn',
  'ox',
  'stag',
  'boar',
  'falcon',
  'prince',
  'eagle',
  'whale',
  'whitehorse',
  'dragonpromoted',
  'horsepromoted',
  'lionpromoted',
  'queenpromoted',
  'bishoppromoted',
  'elephantpromoted',
  'sidemoverpromoted',
  'verticalmoverpromoted',
  'rookpromoted'
]
rolesWithoutTama = roles.select { |role| role != 'tama' }
colors = ['sente', 'gote']

def sameUpDownM(role)
  [
    'bishop',
    'bishoppromoted',
    'boar',
    'chariot',
    'dragon',
    'dragonpromoted',
    'horse',
    'horsepromoted',
    'king',
    'kirin',
    'leopard',
    'lion',
    'lionpromoted',
    'ox',
    'phoenix',
    'prince',
    'queen',
    'queenpromoted',
    'rook',
    'rookpromoted',
    'sidemover',
    'sidemoverpromoted',
    'stag',
    'tama',
    'verticalmover',
    'verticalmoverpromoted',
  ].include? role
end

def classesMnemonic(color, role)
  ".v-chushogi piece.#{role}.#{color}"
end

def classesWithOrientation(color, role, flipped)
  if flipped
    if color == 'sente'
      ".v-chushogi .sg-wrap.orientation-gote piece.#{role}.gote,
      .spare-bottom.v-chushogi piece.#{role}.gote"
    else
      ".v-chushogi .sg-wrap.orientation-gote piece.#{role}.sente,
      .spare-top.v-chushogi piece.#{role}.sente"
    end
  else
    if color == 'sente'
      ".v-chushogi piece.#{role}.sente,
      .v-chushogi .sg-wrap.orientation-sente piece.#{role}.sente,
      .spare-bottom.v-chushogi piece.#{role}.sente"
    else
      ".v-chushogi piece.#{role}.gote,
      .v-chushogi .sg-wrap.orientation-sente piece.#{role}.gote,
      .spare-top.v-chushogi piece.#{role}.gote"
    end
  end
end

def classes(color, role)
  if color == 'sente' # facing up
    if role == 'king'
      ".v-chushogi .sg-wrap.orientation-gote piece.king.gote,
      .spare-bottom.v-chushogi piece.king"
    elsif role == 'tama'
      ".v-chushogi piece.king.sente,
      .v-chushogi .sg-wrap.orientation-sente piece.king.sente,
      .spare-bottom.v-chushogi piece.king.sente"
    else
      ".v-chushogi .sg-wrap.orientation-sente piece.#{role}.sente,
      .v-chushogi .sg-wrap.orientation-gote piece.#{role}.gote,
      .spare-bottom.v-chushogi piece.#{role}"
    end
  else # facing down
    if role == 'king'
      ".v-chushogi .sg-wrap.orientation-sente piece.king.gote,
      .spare-top.v-chushogi piece.king"
    elsif role == 'tama'
      ".v-chushogi .sg-wrap.orientation-gote piece.king.sente,
      .spare-top.v-chushogi piece.king.sente"
    else
      ".v-chushogi .sg-wrap.orientation-sente piece.#{role}.gote,
      .v-chushogi .sg-wrap.orientation-gote piece.#{role}.sente,
      .spare-top.v-chushogi piece.#{role}"
    end
  end
end

# inline SVG
themes.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = colors.map { |color|
    roles.map { |role|
      piece = (color == 'sente' ? '0_' : '1_') + role.upcase
      file = source_dir + name + '/' + piece + '.' + ext
      File.open(file, 'r') do|image_file|
        image = image_file.read
        base64 = Base64.strict_encode64(image)
        classes(color, role) + ' {' +
          "background-image:url('data:image/" + types[ext] + base64 + "') !important;}"
      end
    }
  }.flatten
  if ext == 'png'
    classes.append(".v-chushogi piece { will-change: transform !important; background-repeat: unset !important; }")
  else
    classes.append(".v-chushogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  File.open(dest_dir + name + '.css', 'w') { |f| f.puts classes.join("\n") }
}
bidirectional.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = ['-1', ''].map { |up|
    colors.map { |color|
      rolesWithoutTama.map { |role|
        piece = (color == 'sente' ? '0_' : '1_') + role.upcase + up
        file = source_dir + name + '/' + piece + '.' + ext
        if !(name == 'Chu_Mnemonic' && up == '-1' && sameUpDownM(role))
          File.open(file, 'r') do|image_file|
            image = image_file.read
            base64 = Base64.strict_encode64(image)
            if (sameUpDownM(role) && name == 'Chu_Mnemonic')
              classesMnemonic(color, role) + ' {' +
              "background-image:url('data:image/" + types[ext] + base64 + "') !important;}"
            else
              classesWithOrientation(color, role, up.length != 0) + ' {' +
                "background-image:url('data:image/" + types[ext] + base64 + "') !important;}"
            end
          end
        end
      }
    }
  }.flatten
  if ext == 'png'
    classes.append(".v-chushogi piece { will-change: transform !important; background-repeat: unset !important; }")
  else
    classes.append(".v-chushogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  if name == 'Chu_Mnemonic'
    classes.append(".v-chushogi piece { background-size: contain !important; }")
  end
  File.open(dest_dir + name + '.css', 'w') { |f| f.puts classes.join("\n") }
}

# external SVG
themes.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = colors.map { |color|
    roles.map { |role|
      piece = (color == 'sente' ? '0_' : '1_') + role.upcase
      classes(color, role) + ' {' +
        "background-image:url('/assets/piece/" + name + "/" + piece + "." + ext + "') !important;}"
    }
  }.flatten
  if ext == 'png'
    classes.append(".v-chushogi piece { will-change: transform !important; background-repeat: unset !important; }")
  else
    classes.append(".v-chushogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  File.open(dest_dir + name + '.external.css', 'w') { |f| f.puts classes.join("\n") }
}
bidirectional.map { |theme|
  name = theme[0]
  ext = theme[1]
  classes = ['-1', ''].map { |up|
    colors.map { |color|
      rolesWithoutTama.map { |role|
        piece = (color == 'sente' ? '0_' : '1_') + role.upcase + (name == "Chu_Mnemonic" && sameUpDownM(role) ? "" : up)
        classesWithOrientation(color, role, up.length != 0) + ' {' +
          "background-image:url('/assets/piece/" + name + "/" + piece + "." + ext + "') !important;}"     
      }
    }
  }.flatten
  if ext == 'png'
    classes.append(".v-chushogi piece { will-change: transform !important; background-repeat: unset !important; }")
  else
    classes.append(".v-chushogi piece { will-change: auto; background-repeat: no-repeat; }")
  end
  if name == 'Chu_Mnemonic'
    classes.append(".v-chushogi piece { background-size: contain !important; }")
  end
  File.open(dest_dir + name + '.external.css', 'w') { |f| f.puts classes.join("\n") }
}
