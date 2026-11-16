(*---
description: Evaluates a random set expression, seed 262, number 1167.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01167 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({LET b1868 == 3 IN 2 : b1867 \in (CHOOSE r \in [a : 2..1] : TRUE)} \cup ({0, 3} \cap (2..1 \cup Nat))) \ ([(CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE) EXCEPT ![(CHOOSE b1869 \in 2..1 : TRUE)] = LET b1870 == 2147483647 IN b1870] \cap ({1, 1} \cap (SUBSET {1} \cap {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01167 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 52 to line 14, col 81 of module random_01167
---*)
