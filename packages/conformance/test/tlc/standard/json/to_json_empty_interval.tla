(*---
description: An empty interval is an empty array.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_empty_interval ----
EXTENDS Json, TLC, Naturals
Test == ToJson(3..1) = "[]"
====

(*--- recorded
all:
  exit: 0
---*)
