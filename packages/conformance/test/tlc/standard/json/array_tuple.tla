(*---
description: ToJsonArray of a tuple.
ref: tlc2/module/Json.java#toJsonArray
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE array_tuple ----
EXTENDS Json, TLC, Naturals
Test == ToJsonArray(<<1, 2>>) = "[1,2]"
====

(*--- recorded
all:
  exit: 0
---*)
