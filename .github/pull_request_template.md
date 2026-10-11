## Ticket
<!-- The ticket key, for example INV-123. Tickets live in demo-inventory-api/tickets on its dev branch. -->

## Type
<!-- One of: feature, bugfix, refactor, tests, docs -->

## Summary
<!-- One or two sentences on what changed and why. -->

## Expected behavior
<!--
Derive every item from the ticket requirements and list the requirement ids it covers.
Web changes are checked by a person on the ticket preview, so use ui items with the page to open.
Field reference: pr-triage/docs/contracts.md, section 3.
-->
```yaml expected-behavior
- id: B1
  covers: [R1]
  type: ui
  page: /item.html?id=42
  step: Describe what a person should see on this page.
```
