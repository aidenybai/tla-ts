(*---
description: A function on the empty domain gives an array in ToJsonObject, unlike the empty tuple.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE object_empty_function_is_array ----
EXTENDS Json, TLC, Naturals
Test == ToJsonObject([i \in {} |-> i]) = "[]"
====

(*--- recorded
all:
  exit: 0
---*)
