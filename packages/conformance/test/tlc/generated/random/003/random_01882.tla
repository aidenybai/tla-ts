(*---
description: Evaluates a random seq expression, seed 262, number 1882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([CASE (2..1 = {2, 1, 3}) -> Len(<<1, 2>>) [] OTHER -> (CHOOSE b2959 \in {1} : TRUE) EXCEPT ![1] = Len(SortSeq(<<1>>, LAMBDA p, q : p < q))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01882 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
