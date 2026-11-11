(*---
description: Evaluates a random function expression, seed 262, number 1331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE) @@ [(CHOOSE f \in [2..1 -> 2..1] : TRUE) EXCEPT ![IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN [(1 :> 2) EXCEPT ![3] = 3] ELSE IF TRUE THEN 3 ELSE 1] = ((CHOOSE f \in [{0} \cup {1} -> {}] : TRUE))[(7 \div 3)]]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 69 to line 14, col 102 of module random_01331
    | <<2>>
---*)
