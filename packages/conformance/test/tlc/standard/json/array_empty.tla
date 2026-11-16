(*---
description: ToJsonArray of the empty tuple and set.
ref: tlc2/module/Json.java#toJsonArray
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE array_empty ----
EXTENDS Json, TLC, Naturals
Test == ToJsonArray(<<>>) = "[]" /\ ToJsonArray({}) = "[]"
====

(*--- recorded
all:
  exit: 0
---*)
