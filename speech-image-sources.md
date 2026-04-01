# Speech Image Sources

This file tracks image assets used in `jessy-speech-coach.jsx` for words, imitation actions, and songs.

## Source Policy

- Mixed reputable sources with attribution.
- Images are optional enhancements; UI falls back to icons/emoji if image loading fails.

## Asset Map

### Twemoji (CC-BY 4.0)

- Source: https://github.com/twitter/twemoji
- CDN: https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/
- Used keys:
  - `wordWater` -> `1f4a7.svg`
  - `wordApple` -> `1f34e.svg`
  - `actionClap` -> `1f44f.svg`
  - `actionBlow` -> `1f4a8.svg`
  - `songTwinkle` -> `2b50.svg`
  - `songBus` -> `1f68c.svg`
  - `songMoon` -> `1f319.svg`

### Wikimedia Commons

- Dog photo:
  - Key: `wordDog`
  - URL: https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/320px-Golde33443.jpg
  - File page: https://commons.wikimedia.org/wiki/File:Golde33443.jpg

## Notes

- Verify attribution display requirements if shipped in a production/public app.
- Replace any disputed or unavailable image URLs with equivalent licensed alternatives and update this file.
