(*---
description: A set key uses its toString.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_set_key ----
EXTENDS Json, TLC, Naturals
Test == ToJson({1} :> 1) = "{\"{1}\":1}"
====

(*--- recorded
all:
  exit: 0
---*)
