(*---
description: An interval is an array.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_interval ----
EXTENDS Json, TLC, Naturals
Test == ToJson(1..3) = "[1,2,3]"
====

(*--- recorded
all:
  exit: 0
---*)
