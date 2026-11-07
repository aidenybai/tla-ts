(*---
description: Evaluates a random function expression, seed 262, number 6102.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) @@ (2147483647 :> 2147483647)) EXCEPT ![Len([<<3, 1, 2>> EXCEPT ![1] = 2147483647])] = Cardinality({b9389 \in {x \in 1..3 : x > 1} : Nat})] @@ (CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 92 of module random_06102
    | (0 :> 1 @@ 1 :> 2 @@ 2 :> 2 @@ 2147483647 :> 2147483647)
---*)
