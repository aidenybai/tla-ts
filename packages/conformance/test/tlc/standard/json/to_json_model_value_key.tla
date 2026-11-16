(*---
description: A model value key is its name.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE to_json_model_value_key ----
EXTENDS Json, TLC, Naturals
CONSTANT mv
Test == ToJson(mv :> 1) = "{\"mv\":1}"
====

(*--- recorded
all:
  exit: 0
---*)
