(*---
description: UNION is enumerated.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_union ----
EXTENDS Json, TLC, Naturals
Test == ToJson(UNION {{1}, {2}}) = "[1,2]"
====

(*--- recorded
all:
  exit: 0
---*)
