# Workspace Scope

This workspace is a static website repository. For all LLM-assisted work, limit repository context and file changes to the `torah/` folder and the files that its pages directly or transitively use.

## Allowed Files

- Any file under `torah/`.
- A file outside `torah/` only when it is referenced, loaded, imported, linked, embedded, or otherwise required by a file under `torah/`.
- Transitive dependencies of those files, following the same rule.

Dependencies may include HTML, JavaScript, CSS, fonts, images, audio, video, JSON, and other runtime assets. Resolve relative paths from the referencing file and follow dynamically constructed paths only when the code clearly establishes them.

## Excluded Files

- Treat every other file and folder as out of scope by default, including root pages, `milim/`, `yuchanan/`, `wo/`, and unrelated utilities or media.
- Do not read, modify, refactor, rename, delete, or include out-of-scope files in proposed changes unless the user explicitly overrides this instruction.
- Do not broaden the task to repository-wide cleanup or consistency work.

## Working Rules

- Start investigation from the relevant file under `torah/`.
- Before opening an outside file, establish the reference or runtime dependency from an in-scope file.
- Keep edits minimal and limited to the relevant dependency closure.
- When reporting work, list any outside files included and the in-scope reference that requires each one.
- If a requested change requires a file outside this dependency closure, explain the boundary and ask the user to explicitly authorize expanding the scope.
