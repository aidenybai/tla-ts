(*---
description: A function on 1..n converts through toTuple.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_sequence_function ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", [i \in 1..2 |-> i]) /\ JsonDeserialize("out.json") = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
