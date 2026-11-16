(*---
description: Whitespace-only lines are skipped.
ref: tlc2/module/Json.java#ndDeserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/ws.ndjson
---*)
---- MODULE nd_whitespace_lines ----
EXTENDS Json, TLC, Naturals
Test == ndJsonDeserialize("fixtures/ws.ndjson") = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
