(*---
description: A second write replaces the file.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_overwrites ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", <<1, 2, 3>>) /\ JsonSerialize("out.json", <<1>>) /\ JsonDeserialize("out.json") = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
