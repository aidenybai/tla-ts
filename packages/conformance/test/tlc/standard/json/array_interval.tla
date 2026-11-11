(*---
description: ToJsonArray of an interval.
ref: tlc2/module/Json.java#getArrayNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE array_interval ----
EXTENDS Json, TLC, Naturals
Test == ToJsonArray(1..2) = "[1,2]"
====

(*--- recorded
all:
  exit: 0
---*)
