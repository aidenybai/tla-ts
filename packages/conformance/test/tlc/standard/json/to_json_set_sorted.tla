(*---
description: A set is an array in normalized order.
ref: tlc2/module/Json.java#getArrayNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_set_sorted ----
EXTENDS Json, TLC, Naturals
Test == ToJson({3, 1, 2}) = "[1,2,3]"
====

(*--- recorded
all:
  exit: 0
---*)
