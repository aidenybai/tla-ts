(*---
description: ToJsonArray of a function on 1..n.
ref: tlc2/module/Json.java#getArrayNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE array_function ----
EXTENDS Json, TLC, Naturals
Test == ToJsonArray([i \in 1..2 |-> i]) = "[1,2]"
====

(*--- recorded
all:
  exit: 0
---*)
