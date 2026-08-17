# Years Web Game — Training

A self-paced walkthrough of the `years` match game in this repository. It's a
four-file feature: one data-download script, an Express server, a React
client, and the config glue around them.

**Time budget:** ~45 minutes end to end (five modules).

## How to use this

Work through the modules **in order**. Modules `00`–`03` each teach one
concern with code quoted inline, and end with multiple-choice questions
answerable from **that module's text alone** — you should not need to open the
repo. The final module (`04`) requires opening the actual files and tracing
logic across them.

| #   | File                         | Topic                                   |
| --- | ---------------------------- | --------------------------------------- |
| 0   | `00-big-picture.md`          | The overall architecture and data flow  |
| 1   | `01-data-pipeline.md`        | `fetch-movies.js`: download & filtering |
| 2   | `02-round-generation.md`     | `server.js`: rounds, shuffle, /api      |
| 3   | `03-client-state.md`         | `App.jsx`: state + interaction + score  |
| 4   | `04-code-reading-round.md`   | Requires opening the codebase           |

## About the answer keys

Each module ends with an answer key [ROT13](https://en.wikipedia.org/wiki/ROT13)-encoded
between `<!-- ROT13:START -->` / `<!-- ROT13:END -->` markers. Questions are
plaintext; only the key is scrambled.

## Suggested workflow

1. Read a module top to bottom.
2. Answer its multiple-choice questions **by letter only** (e.g. `1-B, 2-D`)
   before decoding anything.
3. Decode that module's key (`tr 'A-Za-z' 'N-ZA-Mn-za-m'`, or just ask the
   agent to "decode the answer key for module N"), then reconcile any misses.
4. Move to the next module. Keep the code-reading round for last.