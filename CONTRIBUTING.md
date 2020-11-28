# Contributing to @sasjs/utils

## Developer Setup

To get started, clone the repo and install dependencies with `npm install`.

We use Prettier to maintain uniform code style. If you use VSCode, you can install the Prettier extension and enable automatic formatting of your code on save using the following settings in your configuration.

```
    "editor.formatOnPaste": true,
    "editor.formatOnSave": true
```

Alternately, you can run the `lint:fix` NPM script to format your code.

You can run the unit tests using the `test` script.

Unit tests and correctly formatted code are expected in each pull request, and are enforced by our CI checks.

# Local testing

You can create a tarball from your local code using the `package:lib` command.
The created tarball can then be installed in other projects for testing using `npm install <path-to-file>`.
