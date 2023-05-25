# vscode-ghq

This is a Visual Studio Code extension that provides an interface for [ghq](https://github.com/x-motemen/ghq).

## Commands

This extension provides the following commands:

- `ghq.openInCurrentWindow`: Open a repository in the current window.
- `ghq.openInNewWindow`: Open a repository in a new window.
- `ghq.openInBrowser`: Open a repository in the browser.
- `ghq.addToWorkspace`: Add a repository to the current workspace.
- `ghq.openFileInCurrentWindow`: Open a file in the current window.
- `ghq.get`: Clone/sync with a remote repository

  _If an active text editor has an npm or RubyGems package open, we will suggest the repository URL as the default value by guessing it._

## Requirements

- [ghq](https://github.com/x-motemen/ghq) must be installed and available in your PATH.

## Known Issues

None.

## License

This extension is licensed under the [MIT License](LICENSE).
