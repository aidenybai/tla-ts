(*---
description: Evaluates a random seq expression, seed 262, number 3725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(SortSeq([[a |-> 1] EXCEPT ![1] = 1], LAMBDA p, q : p < q), (CHOOSE b5879 \in <<0, -1>> : (TRUE <=> FALSE)), (-(7 % -1))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03725 failed.
    Attempted to access record by a non-string argument: 1
---*)
