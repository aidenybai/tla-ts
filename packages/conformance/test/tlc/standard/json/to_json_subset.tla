(*---
description: SUBSET is enumerated.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_subset ----
EXTENDS Json, TLC, Naturals
Test == ToJson(SUBSET {1}) = "[[],[1]]"
====

(*--- recorded
all:
  exit: 0
---*)
