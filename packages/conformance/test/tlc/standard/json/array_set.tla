(*---
description: ToJsonArray of a set.
ref: tlc2/module/Json.java#toJsonArray
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE array_set ----
EXTENDS Json, TLC, Naturals
Test == ToJsonArray({2, 1}) = "[1,2]"
====

(*--- recorded
all:
  exit: 0
---*)
