(*---
description: Evaluates a random function expression, seed 262, number 8122.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08122 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) @@ (([TRUE EXCEPT ![[a |-> 1]] = 2147483647] @@ (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)) @@ ((CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) @@ (2 :> -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08122 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
