(*---
description: Evaluates a random set expression, seed 262, number 2019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\A b3202 \in {2, 1, 3} : TRUE) => (0 = 2)) \/ ((7 + 1) < Cardinality(1..3))) \cap [(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = ((-1 :> {}))[(0 % 3)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02019 failed.
    Attempted to apply function:
    (-1 :> {})
    to argument 0, which is not in the domain of the function.
---*)
