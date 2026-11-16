(*---
description: Blank lines are skipped.
ref: tlc2/module/Json.java#ndDeserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/blank.ndjson
---*)
---- MODULE nd_blank_lines ----
EXTENDS Json, TLC, Naturals
Test == ndJsonDeserialize("fixtures/blank.ndjson") = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
