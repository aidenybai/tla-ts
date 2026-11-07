(*---
description: The empty string.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_empty_string ----
EXTENDS Json, TLC, Naturals
Test == ToJson("") = "\"\""
====

(*--- recorded
all:
  exit: 0
---*)
