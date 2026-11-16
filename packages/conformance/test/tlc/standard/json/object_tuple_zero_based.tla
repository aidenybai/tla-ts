(*---
description: ToJsonObject of a tuple keys elements from 0, not 1.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE object_tuple_zero_based ----
EXTENDS Json, TLC, Naturals
Test == ToJsonObject(<<"x", "y">>) = "{\"0\":\"x\",\"1\":\"y\"}"
====

(*--- recorded
all:
  exit: 0
---*)
