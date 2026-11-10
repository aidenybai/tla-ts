(*---
description: A function on 1..n prints as a tuple.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_function_as_sequence ----
EXTENDS TLC, Naturals
Test == PrintT([i \in 1..2 |-> i])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
