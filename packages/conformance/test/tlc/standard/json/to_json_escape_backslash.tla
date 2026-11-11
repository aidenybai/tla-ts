(*---
description: A backslash in a string is escaped.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_escape_backslash ----
EXTENDS Json, TLC, Naturals
Test == ToJson("\\") = "\"\\\\\""
====

(*--- recorded
all:
  exit: 0
---*)
