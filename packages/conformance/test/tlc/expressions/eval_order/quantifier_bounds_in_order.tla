(*---
description: "A quantifier evaluates its bounds in source order before it visits any binding."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_bounds_in_order ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == \A x \in P(1, {1}), y \in P(2, {1}) : P(3, TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
