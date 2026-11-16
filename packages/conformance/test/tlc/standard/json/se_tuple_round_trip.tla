(*---
description: A serialized tuple reads back.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_tuple_round_trip ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", <<1, "a">>) /\ JsonDeserialize("out.json") = <<1, "a">>
====

(*--- recorded
all:
  exit: 0
---*)
