(*---
description: Evaluates a random seq expression, seed 262, number 8932.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08932 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq(<<Cardinality({2, 1, 3}), ([x \in Nat |-> x + 1])[-1]>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08932 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 76 to line 14, col 80 of module random_08932>],
    the first argument is:
    -1
    which is not in its domain.
---*)
