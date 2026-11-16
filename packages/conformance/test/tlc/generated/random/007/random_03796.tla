(*---
description: Evaluates a random function expression, seed 262, number 3796.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03796 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) @@ ((CHOOSE b5987 \in {-1, -1} : (b5987 = 1)) :> ([b5988 \in {x \in 1..3 : x > 1} |-> 2])[(-1 % 2147483647)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03796 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 75 to line 14, col 113 of module random_03796
---*)
