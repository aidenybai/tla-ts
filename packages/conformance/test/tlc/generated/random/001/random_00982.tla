(*---
description: Evaluates a random bool expression, seed 262, number 982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cup SUBSET {1}) \cap (2..1 \cap {x \in 1..3 : x > 1})) \cap ((Nat \ SUBSET {1}) \ {b1576 \in <<1, 2>> : TRUE})) = {((CHOOSE b1577 \in {2, 1, 3} : FALSE) + (1 + 2147483647)), ((-7) + (CHOOSE b1578 \in {2, 1, 3} : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00982 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 145 to line 14, col 178 of module random_00982
---*)
