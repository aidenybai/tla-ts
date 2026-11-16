(*---
description: A product is enumerated.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_cross ----
EXTENDS Json, TLC, Naturals
Test == ToJson({1} \X {2}) = "[[1,2]]"
====

(*--- recorded
all:
  exit: 0
---*)
