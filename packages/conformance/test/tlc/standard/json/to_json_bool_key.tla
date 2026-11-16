(*---
description: A Boolean key uses its toString.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_bool_key ----
EXTENDS Json, TLC, Naturals
Test == ToJson(TRUE :> 1) = "{\"TRUE\":1}"
====

(*--- recorded
all:
  exit: 0
---*)
