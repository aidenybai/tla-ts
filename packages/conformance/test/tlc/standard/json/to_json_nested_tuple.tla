(*---
description: Tuples of records.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_nested_tuple ----
EXTENDS Json, TLC, Naturals
Test == ToJson(<<[a |-> 1], [a |-> 2]>>) = "[{\"a\":1},{\"a\":2}]"
====

(*--- recorded
all:
  exit: 0
---*)
