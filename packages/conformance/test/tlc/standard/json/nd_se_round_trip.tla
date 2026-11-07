(*---
description: ndJsonSerialize writes a line per element and reads back.
ref: tlc2/module/Json.java#ndSerialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE nd_se_round_trip ----
EXTENDS Json, TLC, Naturals
Test == ndJsonSerialize("out.ndjson", <<1, [a |-> 2]>>) /\ ndJsonDeserialize("out.ndjson") = <<1, [a |-> 2]>>
====

(*--- recorded
all:
  exit: 0
---*)
