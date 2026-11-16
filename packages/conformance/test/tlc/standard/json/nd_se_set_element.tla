(*---
description: A set element is written as an array.
ref: tlc2/module/Json.java#ndSerialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE nd_se_set_element ----
EXTENDS Json, TLC, Naturals
Test == ndJsonSerialize("out.ndjson", <<{2, 1}>>) /\ ndJsonDeserialize("out.ndjson") = <<<<1, 2>>>>
====

(*--- recorded
all:
  exit: 0
---*)
