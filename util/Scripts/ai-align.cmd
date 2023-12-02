@echo off
setlocal
IF "%~1"=="" (
    echo Please provide a command line argument.
    exit /b
)

set AUDIOFILE=%1.

IF EXIST "%~dp0out\%AUDIOFILE%m4a" (
    DEL "%~dp0out\%AUDIOFILE%m4a"
)

IF EXIST "%~dp0out\%AUDIOFILE%mp3" (
    DEL "%~dp0out\%AUDIOFILE%mp3"
)

IF EXIST "%~dp0out\%AUDIOFILE%TextGrid" (
    DEL "%~dp0out\%AUDIOFILE%TextGrid"
)

IF NOT EXIST "%~dp0out\" (
    MKDIR "%~dp0out\"
)

ffmpeg -i "%~dp0..\wav\%AUDIOFILE%wav" "%~dp0out\%AUDIOFILE%m4a"
ffmpeg -i "%~dp0..\wav\%AUDIOFILE%wav" "%~dp0out\%AUDIOFILE%mp3"

whisperx --model large-v2 --align_model "imvladikon/wav2vec2-xls-r-1b-hebrew" --output_dir out --language he "%~dp0..\wav\%AUDIOFILE%wav"

python to-textgrid.py "%AUDIOFILE%"

del "%~dp0out\%AUDIOFILE%vtt" "%~dp0out\%AUDIOFILE%txt" "%~dp0out\%AUDIOFILE%tsv" "%~dp0out\%AUDIOFILE%srt" "%~dp0out\%AUDIOFILE%json"

endlocal
