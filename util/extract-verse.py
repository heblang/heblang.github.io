import re
import sys
from textgrid import TextGrid
from string import Template

def extract_verse_number(filename):
    match = re.search(r'_(\d{3})\.', filename)
    return match.group(1) if match else None

def extract_chapter_number(filename):
    match = re.search(r'_(\d{3})_\d{3}\.', filename)
    return match.group(1) if match else None

_numbers = {
  1:"א",
  2:"ב",
  3:"ג",
  4:"ד",
  5:"ה",
  6:"ו",
  7:"ז",
  8:"ח",
  9:"ט",
  10:"י",
  11:"יא",
  12:"יב",
  13:"יג",
  14:"יד",
  15:"טו",
  16:"טז",
  17:"יז",
  18:"יח",
  19:"יט",
  20:"כ",
  21:"כא",
  22:"כב",
  23:"כג",
  24:"כד",
  25:"כה",
  26:"כו",
  27:"כז",
  28:"כח",
  29:"כט",
  30:"ל",
  31:"לא",
  32:"לב",
  33:"לג",
  34:"לד",
  35:"לה",
  36:"לו",
  37:"לז",
  38:"לח",
  39:"לט",
  40:"מ",
  41:"מא",
  42:"מב",
  43:"מג",
  44:"מד",
  45:"מה",
  46:"מו",
  47:"מז",
  48:"מח",
  49:"מט",
  50:"נ",
  51:"נא",
  52:"נב",
  53:"נג",
  54:"נד",
  55:"נה",
  56:"נו",
  57:"נז",
  58:"נח",
  59:"נט",
  60:"ס",
  61:"סא",
  62:"סב",
  63:"סג",
  64:"סד",
  65:"סה",
  66:"סו",
  67:"סז",
  68:"סח",
  69:"סט",
  70:"ע",
  71:"עא",
  72:"עב",
  73:"עג",
  74:"עד",
  75:"עה",
  76:"עו",
  77:"עז",
  78:"עח",
  79:"עט",
  80:"פ",
  81:"פא",
  82:"פב",
  83:"פג",
  84:"פד",
  85:"פה",
  86:"פו",
  87:"פז",
  88:"פח",
  89:"פט",
  90:"צ",
  91:"צא",
  92:"צב",
  93:"צג",
  94:"צד",
  95:"צה",
  96:"צו",
  97:"צז",
  98:"צח",
  99:"צט",
  100:"ק",
  101:"קא",
  102:"קב",
  103:"קג",
  104:"קד",
  105:"קה",
  106:"קו",
  107:"קז",
  108:"קח",
  109:"קט",
  110:"קי",
  111:"קיא",
  112:"קיב",
  113:"קיג",
  114:"קיד",
  115:"קטו",
  116:"קטז",
  117:"קיז",
  118:"קיח",
  119:"קיט",
  120:"קכ",
  121:"קכא",
  122:"קכב",
  123:"קכג",
  124:"קכד",
  125:"קכה",
  126:"קכו",
  127:"קכז",
  128:"קכח",
  129:"קכט",
  130:"קל",
  131:"קלא",
  132:"קלב",
  133:"קלג",
  134:"קלד",
  135:"קלה",
  136:"קלו",
  137:"קלז",
  138:"קלח",
  139:"קלט",
  140:"קמ",
  141:"קמא",
  142:"קמב",
  143:"קמג",
  144:"קמד",
  145:"קמה",
  146:"קמו",
  147:"קמז",
  148:"קמח",
  149:"קמט",
  150:"קנ",
  151:"קנא",
  152:"קנב",
  153:"קנג",
  154:"קנד",
  155:"קנה",
  156:"קנו",
  157:"קנז",
  158:"קנח",
  159:"קנט",
  160:"קס",
  161:"קסא",
  162:"קסב",
  163:"קסג",
  164:"קסד",
  165:"קסה",
  166:"קסו",
  167:"קסז",
  168:"קסח",
  169:"קסט",
  170:"קע",
  171:"קעא",
  172:"קעב",
  173:"קעג",
  174:"קעד",
  175:"קעה",
  176:"קעו" 
}

def process_textgrid(file_path):
    tg = TextGrid.fromFile(file_path)
    # Get the "Words" tier
    words_tier = tg.getFirst('Words')
    accents_tier = tg.getFirst('Accents')
    english_tier = tg.getFirst('English')
    phonetic_tier = tg.getFirst('Phonetic')
    latin_tier = tg.getFirst('Latin')

    # Iterate through all tiers except "Segments"
    words = []
    for i, word_interval in enumerate(words_tier):
        # Align the interval with the corresponding "Words" interval
        accents_interval = accents_tier[i]
        english_interval = english_tier[i]
        phonetic_interval = phonetic_tier[i]
        latin_interval = latin_tier[i]
        xmin = 0.5 if word_interval.minTime == 0.0 else word_interval.minTime

        word = {
            'a': accents_interval.mark,   # Accents
            'i': english_interval.mark,   # English
            'p': phonetic_interval.mark,  # Phonetic
            'l': latin_interval.mark,     # Precise
            't': xmin                     # xmin from the Words interval
        }
        words.append(word)
    return words

def create_javascript_file(words, filename):
    verse_number = int(extract_verse_number(filename))
    file_template = Template('      [ // Verse $verse_number\n        {},\n$content      ],\n')
    content_template = Template('        {\n          a: "$a",\n          i: "$i",\n          p: "$p",\n          l: "$l",\n          t: $t,\n        }')
    content = ''
    for index, word in enumerate(words):
      content = content + content_template.substitute(a = word["a"], i = word["i"], p = word["p"], l = word["l"], t = word["t"]) + ('\n' if index == len(words) - 1 else ',\n')
      
    file_content = file_template.substitute(hebrew_verse_number = _numbers[verse_number], verse_number = verse_number, content = content) 
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(file_content)

def create_html_file(words, filename):
    verse = int(extract_verse_number(filename))
    html_template = Template('''    <div class="row">
      <div class="col">
        <div class="no">
          <a href="#" title="Go Up" lang="he" class="heb r">$hebrew_verse&nbsp;</a><br>
          <a href="#" title="Go Up" class="enn">$verse&nbsp;</a>
        </div>
        <div class="tran hide"><a href="#" title="Go Up">&nbsp;&nbsp;</a></div>
      </div>
$content    </div>
''')
    content = ''
    for word, _ in enumerate(words, start=1):
      content = content + f'''      <div class="col">
        <div id="{verse}-{word}w" lang="he" class="heb t"></div>
        <div id="{verse}-{word}i" class="eng"></div>
        <div id="{verse}-{word}t" class="tran hide"></div>
      </div>
'''
    html_content = html_template.substitute(hebrew_verse = _numbers[verse], verse = verse, content = content)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)

# Main execution
if len(sys.argv) < 2:
    print("Usage: python extract-verse.py <filename>")
    sys.exit(1)

filename = sys.argv[1]
data = process_textgrid(filename)
create_javascript_file(data, filename.replace('.TextGrid', '.js'))
create_html_file(data, filename.replace('.TextGrid', '.html'))
