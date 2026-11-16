(*---
description: A function set is enumerated.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_function_set ----
EXTENDS Json, TLC, Naturals
Test == ToJson([{1} -> {2}]) = "[[2]]"
====

(*--- recorded
all:
  exit: 0
---*)
