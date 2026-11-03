# @sasjs/utils

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/sasjs/utils/badge)](https://scorecard.dev/viewer/?uri=github.com/sasjs/utils)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

A library of utilities and types for SASjs written in TypeScript.

## Entry points

This is a Node library, and the barrel - `import { x } from '@sasjs/utils'` - is its Node
entry point. Importing from it pulls in the modules that only Node can run: `fs-extra` and
`@fast-csv/format` through `./file`, `prompts` through `./input`, `chalk` and `consola`
through `./logger` and `./formatter`.

Code that is bundled for a browser imports the subpath it needs instead:

```
import { ServerType } from '@sasjs/utils/types'
import { prefixMessage } from '@sasjs/utils/error'
import { isSpecialMissing } from '@sasjs/utils/input/validators'
import { bytesToSize } from '@sasjs/utils/utils'
import { parseLog } from '@sasjs/utils/logs'
```

The hash and sync helpers - `getHash`, `compareHashes`, `extractHashArray`,
`generateCompileProgram`, `generateProgramToGetRemoteHash`, `generateProgramToSyncHashDiff`
and `findResourcesNotPresentLocally` - live in `@sasjs/utils/fs`. They hash files and
folders on disk, so they are Node-only, and the barrel does not re-export them: a browser
bundle that imports the barrel for anything else no longer reaches `crypto`, which used to
arrive with the whole AES/RSA/ECDSA polyfill suite behind it.

`@sasjs/utils/logs` parses a SAS log: `parseLog(text)` returns every `ERROR`,
`WARNING` and notable `NOTE` as an issue addressed by line and column, and
`nextIssue(issues, line, direction)` walks that list for a next/previous problem
control. It is a pair of pure functions with no imports at all, so it runs
unchanged in Node, in a browser bundle and in an editor extension, and it lives
on a subpath so a browser never reaches the barrel's Node dependencies.

Only the notes the log-checking literature chases are reported - an
uninitialized variable, invalid data, a W.D format too small, values converted to
another type, repeats of BY values - because a log carries thousands of ordinary
notes and none of them is what a reader is looking for. The list is
`NOTE_KEYWORDS` in `src/logs/sasLog.ts`, and adding a keyword is how the scope
grows.

That list comes from [SASLogChecker](https://github.com/Morioka-Yutaka/SASLogChecker),
Yutaka Morioka's MIT-licensed log checker: the 25 targeted NOTE / INFO examples in
its help header map onto the keywords here, and its first commit (July 2025)
already carried them - sixteen months before this parser existed, so the
direction is settled rather than assumed.

Its matcher greps hex-encoded Japanese messages, because it reads logs from a
Japanese Windows SAS session; the English wording here describes the same
messages in SAS's English output. This parser matches English text only, so a
Japanese log yields no notable notes from it.

The SAS user-group papers on log checking are background rather than the source:
their own lists are shorter and worded differently - SUGI 31 128-31 (2006) greps
for six strings, SASGF 2017 1173-2017 / MWSUG 2017 TT02 list eight common
messages, SASGF 2012 042-2012 lists ten categories - and none carries the
statistical notes this list reports (log axis, thinned tick values, infinite
likelihood, not positive definite, processing on disk during summarization).

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/saadjutt01"><img src="https://avatars.githubusercontent.com/u/8914650?v=4?s=100" width="100px;" alt="Muhammad Saad "/><br /><sub><b>Muhammad Saad </b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=saadjutt01" title="Code">💻</a> <a href="https://github.com/sasjs/utils/commits?author=saadjutt01" title="Tests">⚠️</a> <a href="https://github.com/sasjs/utils/pulls?q=is%3Apr+reviewed-by%3Asaadjutt01" title="Reviewed Pull Requests">👀</a> <a href="#mentoring-saadjutt01" title="Mentoring">🧑‍🏫</a> <a href="https://github.com/sasjs/utils/commits?author=saadjutt01" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.erudicat.com"><img src="https://avatars.githubusercontent.com/u/25773492?v=4?s=100" width="100px;" alt="Yury Shkoda"/><br /><sub><b>Yury Shkoda</b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=YuryShkoda" title="Code">💻</a> <a href="#projectManagement-YuryShkoda" title="Project Management">📆</a> <a href="https://github.com/sasjs/utils/commits?author=YuryShkoda" title="Tests">⚠️</a> <a href="#video-YuryShkoda" title="Videos">📹</a> <a href="https://github.com/sasjs/utils/commits?author=YuryShkoda" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://krishna-acondy.io/"><img src="https://avatars.githubusercontent.com/u/2980428?v=4?s=100" width="100px;" alt="Krishna Acondy"/><br /><sub><b>Krishna Acondy</b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=krishna-acondy" title="Code">💻</a> <a href="https://github.com/sasjs/utils/commits?author=krishna-acondy" title="Tests">⚠️</a> <a href="#infra-krishna-acondy" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#content-krishna-acondy" title="Content">🖋</a> <a href="#maintenance-krishna-acondy" title="Maintenance">🚧</a> <a href="#platform-krishna-acondy" title="Packaging/porting to new platform">📦</a> <a href="https://github.com/sasjs/utils/pulls?q=is%3Apr+reviewed-by%3Akrishna-acondy" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/medjedovicm"><img src="https://avatars.githubusercontent.com/u/18329105?v=4?s=100" width="100px;" alt="Mihajlo Medjedovic"/><br /><sub><b>Mihajlo Medjedovic</b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=medjedovicm" title="Code">💻</a> <a href="#infra-medjedovicm" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/sasjs/utils/commits?author=medjedovicm" title="Tests">⚠️</a> <a href="https://github.com/sasjs/utils/pulls?q=is%3Apr+reviewed-by%3Amedjedovicm" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/allanbowe"><img src="https://avatars.githubusercontent.com/u/4420615?v=4?s=100" width="100px;" alt="Allan Bowe"/><br /><sub><b>Allan Bowe</b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=allanbowe" title="Code">💻</a> <a href="https://github.com/sasjs/utils/pulls?q=is%3Apr+reviewed-by%3Aallanbowe" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/sasjs/utils/commits?author=allanbowe" title="Tests">⚠️</a> <a href="#video-allanbowe" title="Videos">📹</a> <a href="https://github.com/sasjs/utils/commits?author=allanbowe" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sabhas"><img src="https://avatars.githubusercontent.com/u/82647447?v=4?s=100" width="100px;" alt="Sabir Hassan"/><br /><sub><b>Sabir Hassan</b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=sabhas" title="Code">💻</a> <a href="https://github.com/sasjs/utils/pulls?q=is%3Apr+reviewed-by%3Asabhas" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/sasjs/utils/commits?author=sabhas" title="Tests">⚠️</a> <a href="#ideas-sabhas" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VladislavParhomchik"><img src="https://avatars.githubusercontent.com/u/83717836?v=4?s=100" width="100px;" alt="VladislavParhomchik"/><br /><sub><b>VladislavParhomchik</b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=VladislavParhomchik" title="Tests">⚠️</a> <a href="https://github.com/sasjs/utils/pulls?q=is%3Apr+reviewed-by%3AVladislavParhomchik" title="Reviewed Pull Requests">👀</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/glM26"><img src="https://avatars.githubusercontent.com/u/35031631?v=4?s=100" width="100px;" alt="glM26"/><br /><sub><b>glM26</b></sub></a><br /><a href="https://github.com/sasjs/utils/commits?author=glM26" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
