(*---
description: A function with empty domain prints as the empty tuple.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_empty_function ----
EXTENDS TLC, Naturals
Test == PrintT([x \in {} |-> 1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
