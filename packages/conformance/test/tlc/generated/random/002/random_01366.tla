(*---
description: Evaluates a random function expression, seed 262, number 1366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 :> 0))[(3 % 1)] :> ([b2178 \in SUBSET {1} |-> 3])[(2 * 3)]) @@ [b2179 \in ({<<>> : b2180 \in {x \in 1..3 : x > 1}} \cap ({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})) |-> IF (TRUE => FALSE) THEN (CHOOSE b2181 \in {1} : FALSE) ELSE ((1 :> 2))[b2179]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01366 failed.
    Attempted to apply function:
    (3 :> 0)
    to argument 0, which is not in the domain of the function.
---*)
