(*---
description: Evaluates a random set expression, seed 262, number 3054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b4853 \in SUBSET {1} : FALSE) * (-1)) * {(b4852 - 0), ({x \in 1..3 : x > 1} \cup [a |-> 1, b |-> TRUE])}) : b4852 \in {b4854 \in (UNION {{2, 1, 3}, <<1>>} \cap DOMAIN [x \in Nat |-> x + 1]) : ([a |-> -1, b |-> FALSE] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03054 failed.
    Attempted to compare the function <<1>> with the value:
    {1, 2, 3}
---*)
