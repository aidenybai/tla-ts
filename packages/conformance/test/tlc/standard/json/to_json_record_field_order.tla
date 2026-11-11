(*---
description: Fields print in the order of the record, as built.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_record_field_order ----
EXTENDS Json, TLC, Naturals
Test == ToJson([b |-> 1, a |-> 2]) = "{\"b\":1,\"a\":2}"
====

(*--- recorded
all:
  exit: 0
---*)
