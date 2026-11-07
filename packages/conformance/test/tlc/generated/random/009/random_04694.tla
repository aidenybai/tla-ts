(*---
description: Evaluates a random set expression, seed 262, number 4694.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04694 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7337 \in {b7338 \in 1..3 : FALSE} : (b7337 \in SUBSET {1})) .. ([<<1>> EXCEPT ![3] = SUBSET {1}])[(-0)]) \cap (UNION {{-1, 7}, {2, [a |-> 1]}} \cup {(0 - 2), ([a |-> 1, b |-> TRUE]).a})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04694 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 84 of module random_04694
---*)
