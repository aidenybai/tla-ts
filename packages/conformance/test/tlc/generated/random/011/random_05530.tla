(*---
description: Evaluates a random function expression, seed 262, number 5530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) @@ [((1 - 1) :> (0 \div 2147483647)) EXCEPT ![(([x \in Nat |-> x + 1])[7] * ([a |-> 1, b |-> TRUE]).a)] = LET b8554 == (2147483647 % 3) IN (2 * b8554)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 78 to line 14, col 107 of module random_05530
    | (0 :> 2 @@ 1 :> 2)
---*)
