(*---
description: A record set is enumerated.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_record_set ----
EXTENDS Json, TLC, Naturals
Test == ToJson([a : {1}]) = "[{\"a\":1}]"
====

(*--- recorded
all:
  exit: 0
---*)
