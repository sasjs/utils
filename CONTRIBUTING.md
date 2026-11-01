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

# Coverage

`coverageThreshold.global` in `jest.config.js` is a **floor, not a target**. Do not raise it to track improvements: the ratchet does that by comparison, not by a number in the repo.

- The `coverage-baseline` workflow (`.github/workflows/coverage-baseline.yml`) runs the suite on every push to `main` and publishes `coverage/coverage-summary.json` as a workflow artifact (90 days). It does not cancel an in-flight run when a newer commit lands - a baseline belongs to a commit, and a pull request based on an older one still needs it.
- On a pull request, `.github/scripts/coverage-ratchet.mjs` finds the baseline published for **its base commit** - `head_sha=github.event.pull_request.base.sha`, not "the newest run on main" - and fails the job if any of the four metrics dropped by more than 0.05pt. That is the gate: coverage cannot go backwards, so the effective bar is always the base tree's figure.
- When the base commit has no baseline of its own (a stacked pull request, or a baseline run that has not finished yet), the job uses the newest baseline whose commit the base commit descends from - an ancestor, never a newer or diverged one - and the warning and the comment both name the commit it compared against. With no such ancestor the job fails.
- A pull request whose base commit predates the baseline workflow has nothing to compare against; the job says so in a warning and in the coverage comment rather than passing quietly, and the check retires itself as soon as the workflow is on the base branch.
- The comment on the pull request is posted by `gh api` from the same comparison the gate used, and edited in place on each push, so a pull request carries one coverage report rather than a thread of them. It shows base, head and delta per metric.

If a drop is intended - deleting code that had tests, or a jest/toolchain upgrade that counts differently - lower `coverageThreshold` in that same pull request and say why in the description. That is the only reason to edit the numbers; a reviewer sees the change in the diff.

The script's own behaviour is pinned by `.github/scripts/coverage-ratchet.test.mjs`, which the test job runs with `node --test`.
