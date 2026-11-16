(*---
description: A last line without newline counts.
ref: tlc2/module/Json.java#ndDeserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/no_nl.ndjson
---*)
---- MODULE nd_no_final_newline ----
EXTENDS Json, TLC, Naturals
Test == ndJsonDeserialize("fixtures/no_nl.ndjson") = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
