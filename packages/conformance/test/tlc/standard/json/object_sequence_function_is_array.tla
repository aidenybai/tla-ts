(*---
description: A function on 1..n stays an array even in ToJsonObject, since FcnRcdValue's path checks first.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE object_sequence_function_is_array ----
EXTENDS Json, TLC, Naturals
Test == ToJsonObject([i \in 1..2 |-> i]) = "[1,2]"
====

(*--- recorded
all:
  exit: 0
---*)
