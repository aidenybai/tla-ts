(*---
description: Each line is an element of a tuple.
ref: tlc2/module/Json.java#ndDeserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/lines.ndjson
---*)
---- MODULE nd_lines ----
EXTENDS Json, TLC, Naturals
Test == ndJsonDeserialize("fixtures/lines.ndjson") = <<1, "a", [b |-> 2]>>
====

(*--- recorded
all:
  exit: 0
---*)
