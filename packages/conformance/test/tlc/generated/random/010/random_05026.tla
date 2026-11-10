(*---
description: Evaluates a random seq expression, seed 262, number 5026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SelectSeq(SubSeq((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE), (2 % 0), (CHOOSE b7817 \in {1, 2} : FALSE)), LAMBDA e : e > 0), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05026 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
