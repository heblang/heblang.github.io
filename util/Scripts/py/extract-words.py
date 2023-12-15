import re
import os
import sys
import json
from textgrid import TextGrid
from string import Template
from pydub import AudioSegment

out_folder = 'out'


def insert_blanks_in_audio(timestamps, audio_file_name):
    # Load the audio file
    audio = AudioSegment.from_file('../wav' + audio_file_name + '.wav')

    # Create a 1-second silent audio segment
    one_second_silence = AudioSegment.silent(duration=1000)

    # Initialize the output audio
    output_audio = AudioSegment.empty()

    last_end = 0
    for timestamp in timestamps:
        # Add the current segment with fade out
        segment = audio[last_end:timestamp].fade_out(50)
        output_audio += segment

        # Add the silent segment
        output_audio += one_second_silence

        # Update the last end point
        last_end = timestamp

    # Add the last segment with fade in
    final_segment = audio[last_end:].fade_in(50)
    output_audio += final_segment

    # Append a final 1-second silence
    output_audio += one_second_silence

    # Extract file name from path and prepend 'P_'
    new_file_name = out_folder + "/P_" + os.path.basename(audio_file_name)

    # Save the output audio
    output_audio.export(new_file_name + '.m4a', format='ipod')
    output_audio.export(new_file_name + '.mp3', format='mp3')


def extract_verse_number(filename):
    match = re.search(r'_(\d{3})\.', filename)
    return match.group(1) if match else None


def extract_chapter_number(filename):
    match = re.search(r'_(\d{3})_\d{3}\.', filename)
    return match.group(1) if match else None


def read_json_from_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)


_numbers = {
    1: "א",
    2: "ב",
    3: "ג",
    4: "ד",
    5: "ה",
    6: "ו",
    7: "ז",
    8: "ח",
    9: "ט",
    10: "י",
    11: "יא",
    12: "יב",
    13: "יג",
    14: "יד",
    15: "טו",
    16: "טז",
    17: "יז",
    18: "יח",
    19: "יט",
    20: "כ",
    21: "כא",
    22: "כב",
    23: "כג",
    24: "כד",
    25: "כה",
    26: "כו",
    27: "כז",
    28: "כח",
    29: "כט",
    30: "ל",
    31: "לא",
    32: "לב",
    33: "לג",
    34: "לד",
    35: "לה",
    36: "לו",
    37: "לז",
    38: "לח",
    39: "לט",
    40: "מ",
    41: "מא",
    42: "מב",
    43: "מג",
    44: "מד",
    45: "מה",
    46: "מו",
    47: "מז",
    48: "מח",
    49: "מט",
    50: "נ",
    51: "נא",
    52: "נב",
    53: "נג",
    54: "נד",
    55: "נה",
    56: "נו",
    57: "נז",
    58: "נח",
    59: "נט",
    60: "ס",
    61: "סא",
    62: "סב",
    63: "סג",
    64: "סד",
    65: "סה",
    66: "סו",
    67: "סז",
    68: "סח",
    69: "סט",
    70: "ע",
    71: "עא",
    72: "עב",
    73: "עג",
    74: "עד",
    75: "עה",
    76: "עו",
    77: "עז",
    78: "עח",
    79: "עט",
    80: "פ",
    81: "פא",
    82: "פב",
    83: "פג",
    84: "פד",
    85: "פה",
    86: "פו",
    87: "פז",
    88: "פח",
    89: "פט",
    90: "צ",
    91: "צא",
    92: "צב",
    93: "צג",
    94: "צד",
    95: "צה",
    96: "צו",
    97: "צז",
    98: "צח",
    99: "צט",
    100: "ק",
    101: "קא",
    102: "קב",
    103: "קג",
    104: "קד",
    105: "קה",
    106: "קו",
    107: "קז",
    108: "קח",
    109: "קט",
    110: "קי",
    111: "קיא",
    112: "קיב",
    113: "קיג",
    114: "קיד",
    115: "קטו",
    116: "קטז",
    117: "קיז",
    118: "קיח",
    119: "קיט",
    120: "קכ",
    121: "קכא",
    122: "קכב",
    123: "קכג",
    124: "קכד",
    125: "קכה",
    126: "קכו",
    127: "קכז",
    128: "קכח",
    129: "קכט",
    130: "קל",
    131: "קלא",
    132: "קלב",
    133: "קלג",
    134: "קלד",
    135: "קלה",
    136: "קלו",
    137: "קלז",
    138: "קלח",
    139: "קלט",
    140: "קמ",
    141: "קמא",
    142: "קמב",
    143: "קמג",
    144: "קמד",
    145: "קמה",
    146: "קמו",
    147: "קמז",
    148: "קמח",
    149: "קמט",
    150: "קנ",
    151: "קנא",
    152: "קנב",
    153: "קנג",
    154: "קנד",
    155: "קנה",
    156: "קנו",
    157: "קנז",
    158: "קנח",
    159: "קנט",
    160: "קס",
    161: "קסא",
    162: "קסב",
    163: "קסג",
    164: "קסד",
    165: "קסה",
    166: "קסו",
    167: "קסז",
    168: "קסח",
    169: "קסט",
    170: "קע",
    171: "קעא",
    172: "קעב",
    173: "קעג",
    174: "קעד",
    175: "קעה",
    176: "קעו"
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
    timestamps = []
    words = []
    for i, word_interval in enumerate(words_tier):
        # Align the interval with the corresponding "Words" interval
        accents_interval = accents_tier[i]
        english_interval = english_tier[i]
        phonetic_interval = phonetic_tier[i]
        latin_interval = latin_tier[i]
        if word_interval.minTime == 0.0:
            xmin = 0.5
        else:
            xmin = word_interval.minTime
            timestamps.append(xmin * 1000)
        xmax = word_interval.maxTime

        word = {
            'a': accents_interval.mark,   # Accents
            'i': english_interval.mark,   # English
            'p': phonetic_interval.mark,  # Phonetic
            'l': latin_interval.mark,     # Precise
            't': {  # xmin from the Words interval
                's': xmin,
                'e': xmax
            }
        }
        words.append(word)
    return [words, timestamps]


def get_parshat_translit(parshat):
    if parshat == '{פ}':
        return 'p̄'
    else:
        return ''


def create_javascript_file(words, filename):
    verse_number = int(extract_verse_number(filename))
    file_template = Template(
        '      [ // Verse $verse_number\n        {},\n$content      ],\n')
    content_template = Template(
        '        {\n          a: "$a",\n          p: "$p",\n          l: "$l",\n          t: { s: $s, e: $e }\n        }')
    content = ''
    for index, word in enumerate(words):
        content = content + content_template.substitute(a=word["a"], p=word["p"], l=word["l"],
                                                        s=word["t"]["s"], e=word["t"]["e"]) + ('\n' if index == len(words) - 1 else ',\n')

    file_content = file_template.substitute(
        hebrew_verse_number=_numbers[verse_number], verse_number=verse_number, content=content)
    with open(out_folder + filename, 'w', encoding='utf-8') as f:
        f.write(file_content)


def create_html_file(words, filename, parshiot):
    verse = int(extract_verse_number(filename))
    html_template = Template('''    <div class="verse">
      <div class="verse-number">
        <div class="no">
          <a href="#" title="Go Up" lang="he" class="heb r">$hebrew_verse</a><br>
          <a href="#" title="Go Up" class="enn">$verse</a>
        </div>
        <div class="tran hide"><a href="#" title="Go Up">&nbsp;&nbsp;</a></div>
      </div>
      <div class="verse-text">
$content      </div>
    </div>
''')
    parshat_template = Template('''        <div class="col">
          <div id="${verse}-${word}w" lang="he" class="parsh heb t">${parshat}</div>
          <div id="${verse}-${word}i" class="eng parsh">&nbsp;</div>
          <div id="${verse}-${word}t" class="tran parsh hide">${parshat_translit}</div>
        </div>
''')
    content = ''
    for wordNo, word in enumerate(words, start=1):
        content = content + f'''        <div class="col">
          <div id="{verse}-{wordNo}w" lang="he" class="heb t"></div>
          <div id="{verse}-{wordNo}i" class="eng">{word["i"]}</div>
          <div id="{verse}-{wordNo}t" class="tran hide"></div>
        </div>
'''
    parshat = parshiot.get(str(verse))
    if (parshat):
        content = content + parshat_template.substitute(verse=verse, word=len(
            words) + 1, parshat=parshat, parshat_translit=get_parshat_translit(parshat))
    html_hebrew_verse = _numbers[verse]

    html_content = html_template.substitute(
        hebrew_verse=html_hebrew_verse, verse=verse, content=content)
    with open(out_folder + filename, 'w', encoding='utf-8') as f:
        f.write(html_content)


def create_directory_if_not_exists(directory_name):
    # Check if the directory already exists
    if not os.path.exists(directory_name):
        # Create the directory
        os.makedirs(directory_name)


# Main execution
if len(sys.argv) < 2:
    print("Usage: python extract-verse.py <filename>")
    sys.exit(1)

filename = sys.argv[1]
data = process_textgrid(filename)
words = data[0]
timestamps = data[1]

create_directory_if_not_exists(out_folder)
create_javascript_file(words, filename.replace('.TextGrid', '.js'))
create_html_file(words, filename.replace('.TextGrid', '.html'),
                 read_json_from_file(filename[:-13] + '.json'))
insert_blanks_in_audio(timestamps, filename.replace('.TextGrid', ''))
