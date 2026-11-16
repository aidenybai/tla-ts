(*---
description: A record prints nested values.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_nested_record ----
EXTENDS TLC, Naturals
Test == PrintT([a |-> [b |-> <<1>>]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> [b |-> <<1>>]]"
---*)
