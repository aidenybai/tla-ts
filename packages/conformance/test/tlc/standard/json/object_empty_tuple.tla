(*---
description: ToJsonObject of the empty tuple is an empty object.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE object_empty_tuple ----
EXTENDS Json, TLC, Naturals
Test == ToJsonObject(<<>>) = "{}"
====

(*--- recorded
all:
  exit: 0
---*)
