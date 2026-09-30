# Friction Log

## 1. `sam build` (no container) silently bundles a Windows-only dependency

- **Task attempted**: Build the orchestrator Lambda (`sam build`) on a Windows
  dev machine to deploy a code change.
- **Steps taken**: Ran `sam build` directly (no `--use-container`).
- **Expected result**: A Lambda-compatible Linux package with the Python
  dependencies from `orchestrator/requirements.txt`.
- **Actual result**: Build failed with
  `PythonPipBuilder:ResolveDependencies - {pywin32==312(wheel)}`. The `mcp`
  package declares `pywin32>=311; sys_platform == 'win32'` as a conditional
  dependency, and pip's non-container dependency resolution evaluates that
  marker against the *host* OS (Windows) instead of the Lambda's target
  platform (Linux), so it tries to pull in a package that will never work at
  runtime.
- **Severity**: High — this fails loudly, but a developer without prior AWS
  Lambda packaging experience could easily assume `sam build` accounts for
  target-platform markers automatically, since nothing in the CLI's own docs
  flags this Windows-specific gotcha for conditional dependencies.
- **Workaround**: Re-ran with `sam build --use-container`, which builds inside
  an Amazon Linux Docker image and resolves the markers correctly.
- **Suggestion**: `sam build` (no container) could warn explicitly when a
  resolved dependency graph includes a platform-marker match that would
  differ between the host OS and the Lambda runtime's OS/architecture.

## 2. `sam deploy` succeeds even when Lambda code is missing its dependencies

- **Task attempted**: Deploy a template change (new Cognito auth-flow
  setting) quickly, without re-running `sam build` first, by pointing
  `sam deploy --template-file template.yaml` at the raw source template.
- **Expected result**: Either a clear error that the code needs building
  first, or a deploy that correctly re-packages the existing dependencies.
- **Actual result**: The deploy succeeded (CloudFormation reported
  `UPDATE_COMPLETE`) — but `sam deploy` re-packaged the Lambda code straight
  from the source directory, without the `pip install`-ed dependencies from
  the last container build. The break was invisible until the WebSocket
  `$connect` route started returning 502s and CloudWatch showed
  `Runtime.ImportModuleError: No module named 'httpx2'` in production.
- **Severity**: Critical — this took down the live demo in front of an end
  user with zero warning at deploy time. A successful CloudFormation update
  gave false confidence that everything was fine.
- **Workaround**: Always run `sam build --use-container` immediately before
  every `sam deploy`, and never call `sam deploy --template-file` pointing at
  the unbuilt source template.
- **Suggestion**: `sam deploy` could detect that a `--template-file` argument
  points outside `.aws-sam/build/` and print a loud warning that dependencies
  won't be repackaged, or refuse and suggest `sam build` first.

## 3. Cognito `UsernameAttributes` can't be changed in place via CloudFormation

- **Task attempted**: Change a User Pool from email-only usernames to plain
  usernames (to support a `demo` account) by editing `UsernameAttributes` on
  the existing `AWS::Cognito::UserPool` resource and redeploying.
- **Expected result**: CloudFormation either updates the property or clearly
  states it requires replacement (many resources support one or the other).
- **Actual result**: `UPDATE_FAILED — Updates are not allowed for property -
  UsernameAttributes`, and CloudFormation does **not** offer automatic
  replacement for this property the way it does for many other
  replacement-triggering changes — the stack just rolls back.
- **Severity**: Medium — recoverable, but the fix (rename the logical
  resource ID so CloudFormation treats it as a brand-new resource) isn't
  something the error message hints at, and isn't obvious from the AWS::Cognito::UserPool
  documentation.
- **Workaround**: Renamed `UserPool`/`UserPoolClient` to `UserPoolV2`/
  `UserPoolClientV2` in the template, forcing CloudFormation to create new
  resources and delete the old ones.
- **Suggestion**: The CloudFormation resource docs for `AWS::Cognito::UserPool`
  could flag `UsernameAttributes` as "no in-place update, no automatic
  replacement — rename the logical ID to force replacement" directly next to
  the property.

## 4. Bedrock occasionally returns non-strict JSON despite explicit instructions

- **Task attempted**: Ask Bedrock (Nova Micro) to return a JSON array of
  generated practice phrases, with the prompt explicitly saying "Reply with
  ONLY a JSON array of strings, no other text."
- **Expected result**: Strictly parseable JSON every time.
- **Actual result**: Intermittently (roughly 1 in 4–5 calls in testing), the
  model used typographic "smart" apostrophes/quotes (`'` `'` `"` `"`) inside
  the JSON string values instead of straight ASCII quotes, which breaks
  Python's `json.loads` with a `JSONDecodeError`.
- **Severity**: Medium — silent-ish failure mode; without defensive handling,
  a user-facing feature (phrase generation) would intermittently 500 with no
  clear cause from the client side.
- **Workaround**: Normalize `‘ ’ “ ”` to ASCII quotes
  before parsing, and fall back to a hardcoded phrase list if parsing still
  fails.
- **Suggestion**: Bedrock's structured-output / JSON mode (if available for
  Nova Micro) could guarantee ASCII-safe quoting, or the docs could call out
  that typographic quote substitution is a known model behavior to defend
  against in prompts asking for strict JSON.

## 5. Cognito App Client doesn't default to the SDK's expected auth flow

- **Task attempted**: Sign in from the browser using `amazon-cognito-identity-js`'s
  default `authenticateUser()`, against a freshly created `UserPoolClient`.
- **Expected result**: Successful login using the SDK's default (SRP) flow.
- **Actual result**: `NotAuthorizedException: USER_SRP_AUTH is not enabled for
  the client.` — the CloudFormation `ExplicitAuthFlows` list we'd written
  only included `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`,
  which is a reasonable-looking pair to a first-time Cognito user, but isn't
  what the most common JS client SDK uses by default.
- **Severity**: Low-medium — quick fix once diagnosed, but the error message
  doesn't mention that `amazon-cognito-identity-js`'s default flow is SRP, so
  a developer following only the AWS docs (which show `ALLOW_USER_PASSWORD_AUTH`
  prominently) can plausibly ship a client library mismatch.
- **Workaround**: Added `ALLOW_USER_SRP_AUTH` to `ExplicitAuthFlows`.
- **Suggestion**: Cognito App Client creation (console and CFN docs) could
  note explicitly which auth flow each popular official SDK defaults to.
