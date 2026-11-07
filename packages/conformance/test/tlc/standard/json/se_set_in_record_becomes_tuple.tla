(*---
description: A set inside a value comes back as a tuple.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_set_in_record_becomes_tuple ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", [a |-> {2, 1}]) /\ JsonDeserialize("out.json") = [a |-> <<1, 2>>]
====

(*--- recorded
all:
  exit: 0
---*)
