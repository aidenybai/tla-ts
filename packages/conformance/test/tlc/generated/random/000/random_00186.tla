(*---
description: Evaluates a random bool expression, seed 262, number 186.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00186 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} = {x \in 1..3 : x > 1}) /\ ({x \in 1..3 : x > 1} \subseteq 2..1)) => ([[a |-> 1] EXCEPT !.a = 3] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE))) => (Len(SelectSeq([x \in Nat |-> x + 1], LAMBDA e : e > 0)) < (-(-1 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00186 failed.
    Attempted to check equality of the set {} with the value:
    2
---*)
