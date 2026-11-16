(*---
description: Evaluates a random set expression, seed 262, number 9973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b15509 \in (({2, 1, 3} \ SUBSET {1}) \ {b15510 : b15510 \in SUBSET {1}}) : (~(FALSE \/ FALSE))} \cup ({([a |-> 1]).a, [[x \in 1..2 |-> x] EXCEPT ![2] = 0]} \cap {Head(<<>>) : b15511 \in UNION {Nat, {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09973 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
