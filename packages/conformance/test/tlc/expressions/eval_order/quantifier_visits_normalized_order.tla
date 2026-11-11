(*---
description: "A quantifier visits a set enumeration in normalized order rather than source order."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_visits_normalized_order ----
EXTENDS Integers, TLC
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
