@echo off
setlocal
IF "%~1"=="" (
    echo Please provide a command line argument.
    exit /b
)

set AUDIOFILE=%1.

IF EXIST %AUDIOFILE%m4a (
    DEL %AUDIOFILE%m4a
)

IF EXIST %AUDIOFILE%mp3 (
    DEL %AUDIOFILE%mp3
)

ffmpeg -i "%AUDIOFILE%wav" "%AUDIOFILE%m4a"
ffmpeg -i "%AUDIOFILE%wav" "%AUDIOFILE%mp3"

whisperx --model large-v2 --align_model "imvladikon/wav2vec2-xls-r-1b-hebrew" --language he %AUDIOFILE%wav

python to-textgrid.py "%AUDIOFILE%"

del "%AUDIOFILE%vtt" "%AUDIOFILE%txt" "%AUDIOFILE%tsv" "%AUDIOFILE%srt" "%AUDIOFILE%json"

endlocal