(*---
description: A function on 0..1 is an object.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_int_keys_from_zero ----
EXTENDS Json, TLC, Naturals
Test == ToJson([i \in 0..1 |-> i]) = "{\"0\":0,\"1\":1}"
====

(*--- recorded
all:
  exit: 0
---*)
