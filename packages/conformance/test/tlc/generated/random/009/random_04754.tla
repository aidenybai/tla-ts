(*---
description: Evaluates a random bool expression, seed 262, number 4754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7423 \in DOMAIN [(CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE) EXCEPT ![LET b7424 == 2 IN 2147483647] = ([a |-> 1]).a] : ((LET b7425 == b7423 IN 3 \in (TRUE \cap {1, 2})) /\ ((FALSE => TRUE) <=> (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 82 of module random_04754
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04754 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
