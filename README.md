# demo-inventory-web

The web front end of a small inventory demo. It exists to show
[pr-triage](https://github.com/jaeneungsim/pr-triage), a GitHub App on AWS that reviews every PR
before a person does: it checks the ticket and the policy, waits for CI, deploys the ticket to a
preview, asks an AI model on Amazon Bedrock for a review, and decides in code whether the PR is
approvable, needs changes or needs a person.

The API lives in [demo-inventory-api](https://github.com/jaeneungsim/demo-inventory-api), which
also holds the tickets (`tickets/INV-123.md`).

## Pages

| Page | Shows |
|---|---|
| `index.html` | the item list |
| `item.html?id=42` | one item: name, price and id |

`config.js` sets the API URL (`window.INV_CONFIG.apiUrl`). Deploy workflows overwrite it.

## How a PR is checked

| Workflow | When | What |
|---|---|---|
| `ci` | every PR, push to `dev` | unit tests, every page refers only to files that exist |
| `web-preview` | PRs from this repo, level v3 | copies `src/` to the ticket preview and uploads `preview.json` |
| `web-preview-destroy` | PR closed | removes the ticket preview |
| `deploy-dev` | push to `dev` | publishes the dev site |

The repo variable `TRIAGE_LEVEL` (`v1`, `v2` or `v3`, default `v3`) turns the preview on or off.
pr-triage waits for these workflows by name; see `pr-triage/docs/contracts.md`.

## Ticket-level preview

All previews share one S3 bucket behind one CloudFront distribution. A ticket's preview is a
prefix in that bucket, so INV-123 is served at `https://<domain>/inv-123/item.html?id=42`.
Its `config.js` points at the API stack of the same ticket (`inv-api-preview-inv-123`) when the
ticket has an API PR, and at the dev API otherwise. Copying files to a prefix takes seconds,
while a CloudFront distribution per ticket would take minutes to create and delete.

Fork PRs never deploy, and the preview role can only write to the preview bucket.

## Run it locally

1. Start the API's local server on port 8080 (see the demo-inventory-api README). It must allow
   CORS for the local web origin.
2. Serve this repo's `src/` folder and open the list page:

   ```sh
   python3 -m http.server 5173 --directory src
   # open http://localhost:5173/index.html
   ```

`src/config.js` already points at `http://localhost:8080`.

## Tests

```sh
npm test
node scripts/check-html-refs.mjs src
```

Node 22 or later, no dependencies.

## Contributing

Run `scripts/setup-hooks.sh` once to enable the commit-msg hook, read [AGENTS.md](AGENTS.md),
and fill the PR template, including the expected behavior.

## Repo variables

`AWS_REGION`, `PREVIEW_ROLE_ARN`, `DEV_ROLE_ARN`, `WEB_PREVIEW_BUCKET`, `WEB_PREVIEW_DOMAIN`
and `TRIAGE_LEVEL`. pr-triage's `scripts/configure_demo_repos.sh` sets them.
