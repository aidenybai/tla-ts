(*---
description: Records nest, with arrays for sets within them.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_nested_record ----
EXTENDS Json, TLC, Naturals
Test == ToJson([a |-> [b |-> {2, 1}]]) = "{\"a\":{\"b\":[1,2]}}"
====

(*--- recorded
all:
  exit: 0
---*)
