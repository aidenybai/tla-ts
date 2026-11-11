(*---
description: "The bound of a nested quantifier runs again for each outer binding."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE nested_bound_reevaluated_per_binding ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == \A x \in 1..2 : \A y \in P(x, {x}) : y = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
