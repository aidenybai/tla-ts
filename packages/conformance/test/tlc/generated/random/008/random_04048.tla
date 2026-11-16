(*---
description: Evaluates a random seq expression, seed 262, number 4048.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([((CHOOSE b6374 \in {x \in 1..3 : x > 1} : TRUE) = Cardinality({})) EXCEPT ![1] = ((CHOOSE b6375 \in {} : FALSE) * (1 \div 0))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04048 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
