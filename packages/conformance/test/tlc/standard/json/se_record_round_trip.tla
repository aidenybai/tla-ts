(*---
description: A serialized record reads back.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_record_round_trip ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", [a |-> 1]) /\ JsonDeserialize("out.json") = [a |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
