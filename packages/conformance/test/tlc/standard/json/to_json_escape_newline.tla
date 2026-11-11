(*---
description: A newline in a string is escaped.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_escape_newline ----
EXTENDS Json, TLC, Naturals
Test == ToJson("a\nb") = "\"a\\nb\""
====

(*--- recorded
all:
  exit: 0
---*)
