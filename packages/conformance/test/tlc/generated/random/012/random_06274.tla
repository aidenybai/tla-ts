(*---
description: Evaluates a random bool expression, seed 262, number 6274.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06274 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~([[a |-> 1] EXCEPT !.a = 0] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))) \/ (IF (~FALSE) THEN Cardinality({1, 2}) ELSE LET b9656 == 2147483647 IN b9656 < Cardinality((TRUE \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06274 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    an integer.
    line 14, col 17 to line 14, col 200 of module random_06274
---*)
