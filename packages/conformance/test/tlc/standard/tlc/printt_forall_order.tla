(*---
description: \A over a set prints elements in normalized order.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_forall_order ----
EXTENDS TLC, Naturals
Test == \A x \in {3, 1, 2} : PrintT(x)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
