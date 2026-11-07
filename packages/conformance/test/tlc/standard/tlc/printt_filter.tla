(*---
description: A filter over an enumerable set evaluates when printed.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_filter ----
EXTENDS TLC, Naturals
Test == PrintT({x \in 1..3 : x > 1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
