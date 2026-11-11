(*---
description: The empty tuple round trips.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_empty_tuple ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", <<>>) /\ JsonDeserialize("out.json") = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
