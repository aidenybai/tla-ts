(*---
description: A quote in a string is escaped.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_escape_quote ----
EXTENDS Json, TLC, Naturals
Test == ToJson("a\"b") = "\"a\\\"b\""
====

(*--- recorded
all:
  exit: 0
---*)
