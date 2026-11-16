(*---
description: A function on 1..n converts.
ref: tlc2/module/Json.java#ndSerialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE nd_se_function ----
EXTENDS Json, TLC, Naturals
Test == ndJsonSerialize("out.ndjson", [i \in 1..2 |-> i]) /\ ndJsonDeserialize("out.ndjson") = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
