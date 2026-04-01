# <span style="color: #32ae62;">Creating Terminal Commands</span>

**Last Updated**: TSH-v2.3 - 02/11/2026

Welcome — creating commands for the Terbium Terminal is simple and flexible. This document is refreshed to cover the new APIs, interactive behavior (passthrough), built-in commands, and best practices.

## Where to put your command

Place your script in the Terminal app's `scripts` folder. From the root (`//`) open `fs/apps/system/terminal.tapp/scripts/` (or `fs/apps/user/<yourname>/terminal/`) and add your `.js` file.

The Terminal executes the script's code directly and expects your file to register a callable function (typical pattern: define and then call a function that accepts `args`).

## Minimal example

```js
function hello(args) {
  displayOutput(`Hi, how are you ${args[0] || 'stranger'}!`);
  createNewCommandInput(); // show a new prompt
}

hello(args);
```

Run: `hello Alice` → prints `Hi, how are you Alice!` and then returns a prompt.

## Script API (what your script can call)

When your script runs inside an active Terminal session, it receives the following helper functions and objects (passed as parameters):

- `args` — Array of raw arguments (strings) from the command line (e.g. for `foo a b` args = [`"a"`,`"b"`]).
- `displayOutput(message, ...styles)` — Print message to the terminal. Supports `%c` style placeholders with CSS-style strings (`'color: #ff0000'`).
- `displayError(message)` — Print an error message (red, prefixed with `ERR:`).
- `createNewCommandInput()` — Show a new prompt (call when your command is complete). Note: this is debounced and will no-op during interactive passthrough mode (see below).
- `term` — The raw xterm instance (advanced use only).
- `path` — Current working path string.
- `terbium` or `tb` — The [Terbium API](./apis/readme.md)
- `buffer` — Internal buffer object (rarely needed).
- `setTabTitle(title)` — (Available when running inside a session) Change the tab label for this session (e.g. `setTabTitle('Node: JSH')`).
- `exitPassthrough()` — (Passed to interactive command scripts) Use this to explicitly end passthrough mode when your script finishes or the spawned interactive child exits.

Important: when running scripts from outside a session (no active session), fewer helpers are available (for example `setTabTitle` may *not* be provided). Write scripts defensively and check for the existence of optional helpers if you need to support both contexts.

## Interactive / passthrough mode

Some commands (for example `node` and `nano`) are interactive shells that echo input and control terminal state. The Terminal will automatically:

- Enter **passthrough** mode when it detects common interactive commands. In passthrough mode:
  - The engine stops processing typed commands itself.
  - Local echo is disabled (the interactive program will echo input itself).
  - `createNewCommandInput()` is intentionally ignored while passthrough is active (to avoid double prompts).
- Exit passthrough when the interactive program prints an exit message (or when your script calls `exitPassthrough()` explicitly).

If you need to spawn an interactive process from a script, call `exitPassthrough()` after the process exits so the engine will restore the prompt.

## Best practices

- Always call `createNewCommandInput()` when your command finishes to show the prompt (unless your command intentionally stays interactive).
- Avoid calling `createNewCommandInput()` multiple times in quick succession — the engine debounces prompt creation (short window) to prevent double prompts.
- Use `displayError()` for errors so output is styled consistently.
- Use `setTabTitle()` to reflect session state (e.g., `setTabTitle('Node: JSH')` while running a REPL).
- Check for optional helpers if you expect your script to run both inside and outside a session.

## Example: setting tab title and using passthrough

```js
// This example is a pattern — actual interactive processes depend on your environment
async function nodeWrapper(args) {
  setTabTitle && setTabTitle('Node: JSH');
  displayOutput('Starting Node.js...');

  // If your script starts an interactive child, you can rely on the engine's passthrough,
  // or call exitPassthrough() explicitly when the child finishes:
  // (pseudo-code)
  // await spawnNode(args).finally(() => exitPassthrough && exitPassthrough());
}

nodeWrapper(args);
```

## Troubleshooting

- If you see duplicated input while in a REPL, it's usually because both the engine and the program are echoing — ensure passthrough is active for interactive programs (engine handles common shells automatically).
- If the prompt appears twice, the engine now debounces `createNewCommandInput()` calls; check long-running scripts that might call it twice and avoid redundant calls.

If you'd like, I can add a small script template generator under `scripts/` to scaffold correct patterns (including usage of `setTabTitle()` and `exitPassthrough()`), and a short test harness that runs a few sample scripts to verify behavior.

Happy scripting! 🚀
