(*---
description: Conjuncts print in order.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_conjunct_order ----
EXTENDS TLC, Naturals
Test == PrintT(1) /\ PrintT(2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
