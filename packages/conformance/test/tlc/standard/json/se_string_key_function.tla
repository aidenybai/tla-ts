(*---
description: A function on strings converts through toRcd.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_string_key_function ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", "a" :> 1) /\ JsonDeserialize("out.json") = [a |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
