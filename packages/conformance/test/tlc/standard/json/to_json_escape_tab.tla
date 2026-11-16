(*---
description: A tab in a string is escaped.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_escape_tab ----
EXTENDS Json, TLC, Naturals
Test == ToJson("a\tb") = "\"a\\tb\""
====

(*--- recorded
all:
  exit: 0
---*)
