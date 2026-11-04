# action-pins

Fails a build when a workflow in this repository uses an action that is not pinned to
a commit, or is pinned to a commit that does not exist.

```yaml
permissions:
  contents: read

jobs:
  resolve:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@<sha> # v7.0.1
      - uses: sasjs/utils/.github/actions/action-pins@<sha>
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

The token needs `contents: read` on the repository being checked and on the public
repositories it names - the default `GITHUB_TOKEN` is enough. The job needs
`timeout-minutes` no shorter than the checker's own retry budget (two retries of 5s
and 10s per pin, or the `Retry-After` the API asks for, capped at 30s).

## What it checks

Every `uses:` in `.github`, except a local one (`./...`) or a container (`docker://...`),
must name a 40-character commit SHA, and that commit must exist. A tag or a branch is
not a pin: a tag can be moved and a branch always moves.

A `uses:` inside a `run:` block scalar is shell text and is ignored. A flow-style step
(`- {name: x, uses: owner/repo@sha}`) is read. Quotes are stripped before comparison.

## The four answers

| answer | meaning | effect |
|---|---|---|
| `ok` | the commit exists in that repository | passes |
| `bad` | 404 or 422 - no such commit there | fails |
| `denied` | 401, or a 403 that is not throttling - the token cannot read it | fails, and says the token is the problem, not the pin |
| `unknown` | rate limit, 5xx, network error, or a 403 with no readable body | warns |

`unknown` warns because a busy API says nothing about the pin. But if *every* pin comes
back unverifiable, the run fails: a gate that verified nothing must not read as a pass.

## Exit status

`0` when every pin is `ok`, or when some are `ok` and the rest are `unknown`.
`1` otherwise, including the everything-unverified case.

## Tests

`test_check_action_pins.py` pins the parser's reading of a workflow and the checker's
reading of an API answer: 27 cases, no network, no token. The action runs them before
the check, so a change to either file is exercised in the pull request that makes it.
