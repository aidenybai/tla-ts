(*---
description: ToJsonArray of a function on strings gives an object.
ref: tlc2/module/Json.java#getArrayNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE array_string_key_function_is_object ----
EXTENDS Json, TLC, Naturals
Test == ToJsonArray("a" :> 1) = "{\"a\":1}"
====

(*--- recorded
all:
  exit: 0
---*)
