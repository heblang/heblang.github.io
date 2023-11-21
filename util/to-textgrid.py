import json
import sys
from pydub.utils import mediainfo

def get_audio_length(audio_file):
    info = mediainfo(audio_file)
    duration = float(info["duration"])
    return duration

def json_to_textgrid(json_data, xmax):
    # Create a header for the TextGrid file
    header = f"""File type = "ooTextFile"
Object class = "TextGrid"

xmin = 0
xmax = {xmax}
tiers? <exists>
size = 6
item []:
"""

    boundaries = []
    words = json_data["word_segments"]
    header += f"""    item [1]:
        class = "IntervalTier"
        name = "Words"
        xmin = 0
        xmax = {xmax}
        intervals: size = {len(json_data["word_segments"])}
""" 
    last_end_time = 0
    for idx, word in enumerate(words, start=1):
        # Adjust start time for the first word
        start_time = last_end_time
        quiet_time = (words[idx]["start"] if idx < len(words) else xmax) - word["end"]
        last_end_time = word["end"] + quiet_time / 2 if idx < len(words) else xmax 
        end_time = last_end_time     
        boundaries.append({"start": start_time, "end": end_time});

        header += f"""        intervals [{idx}]:
            xmin = {start_time}
            xmax = {end_time}
            text = "{word["word"]}"
"""

    # Adding empty intervals
    for tier_name, tier_num in [("Accents", 2), ("Phonetic", 3), ("Latin", 4), ("English", 5)]:
        header += f"""    item [{tier_num}]:
            class = "IntervalTier"
            name = "{tier_name}"
            xmin = 0
            xmax = {xmax}
            intervals: size = {len(boundaries)}
"""
        for idx, word in enumerate(boundaries, start=1):
            # Adjust start time for the first word
            start_time = word["start"]
            end_time = word["end"]
            header += f"""        intervals [{idx}]:
                xmin = {start_time}
                xmax = {end_time}
                text = ""
"""

    segments = json_data["segments"]
    header += f"""    item [4]:
        class = "IntervalTier"
        name = "Segments"
        xmin = 0
        xmax = {xmax}
        intervals: size = {len(json_data["segments"])}
"""
    for idx, segment in enumerate(segments, start=1):
        # Adjust start time for the first segment
        start_time = segment["start"]
        if idx == 1:
            start_time = 0
        # Adjust end time of the segment
        end_time = segment["end"]
        if idx < len(segments):  # If not the last segment
            end_time = segments[idx]["start"]
        else:
            end_time = xmax
        header += f"""        intervals [{idx}]:
            xmin = {start_time}
            xmax = {end_time}
            text = "{segment["text"]}"
"""

    return header

if __name__ == '__main__':
    input_filename = sys.argv[1]
    
    with open(input_filename + 'json', 'r', encoding="utf-8") as json_file:
        data = json.load(json_file)
    
    audio_length = get_audio_length(input_filename + 'wav')
    print(audio_length)
    textgrid_content = json_to_textgrid(data, audio_length)
    
    output_filename = input_filename + 'TextGrid'
    with open(output_filename, 'w', encoding="utf-8") as output_file:
        output_file.write(textgrid_content)
    print(f"TextGrid file saved as {output_filename}")
