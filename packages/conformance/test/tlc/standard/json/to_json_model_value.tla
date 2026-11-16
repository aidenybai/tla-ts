(*---
description: A model value serializes as a string of its name.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE to_json_model_value ----
EXTENDS Json, TLC, Naturals
CONSTANT mv
Test == ToJson(mv) = "\"mv\""
====

(*--- recorded
all:
  exit: 0
---*)
