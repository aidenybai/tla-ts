(*---
description: ToJsonObject of a record.
ref: tlc2/module/Json.java#toJsonObject
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE object_record ----
EXTENDS Json, TLC, Naturals
Test == ToJsonObject([a |-> 1]) = "{\"a\":1}"
====

(*--- recorded
all:
  exit: 0
---*)
