(*---
description: A string key is used bare.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_string_keys ----
EXTENDS Json, TLC, Naturals
Test == ToJson("a b" :> 1) = "{\"a b\":1}"
====

(*--- recorded
all:
  exit: 0
---*)
