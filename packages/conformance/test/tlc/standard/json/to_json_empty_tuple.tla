(*---
description: The empty tuple is an empty array.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_empty_tuple ----
EXTENDS Json, TLC, Naturals
Test == ToJson(<<>>) = "[]"
====

(*--- recorded
all:
  exit: 0
---*)
