(*---
description: The empty set is an empty array.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_empty_set ----
EXTENDS Json, TLC, Naturals
Test == ToJson({}) = "[]"
====

(*--- recorded
all:
  exit: 0
---*)
