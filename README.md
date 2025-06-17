it's not ready yet

setup:
- install bun: https://bun.sh/
- `bun install`
- `bun serve`

dev:
- http://localhost:7898/prompt.txt
- type prompt & paste contents of prompt.txt below
- test every component it touches
- files outside of src/ or in src/data/ are hidden. if it adds new stuff you'll
  have to add the lua implementation manually in src/data/generateLua.ts
- add anything you think of in TODO.md