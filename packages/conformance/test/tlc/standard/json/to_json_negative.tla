(*---
description: A negative integer prints with its sign.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_negative ----
EXTENDS Json, TLC, Integers
Test == ToJson(-5) = "-5"
====

(*--- recorded
all:
  exit: 0
---*)
