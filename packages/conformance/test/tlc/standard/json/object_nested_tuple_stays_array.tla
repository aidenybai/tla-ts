(*---
description: Only the outer tuple becomes an object.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE object_nested_tuple_stays_array ----
EXTENDS Json, TLC, Naturals
Test == ToJsonObject(<<<<1>>>>) = "{\"0\":[1]}"
====

(*--- recorded
all:
  exit: 0
---*)
