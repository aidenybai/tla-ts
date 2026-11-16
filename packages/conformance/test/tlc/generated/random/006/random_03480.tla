(*---
description: Evaluates a random seq expression, seed 262, number 3480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq([Append(<<>>, 0) EXCEPT ![1] = ([x \in Nat |-> x + 1])[-1]], LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03480 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 79 to line 14, col 83 of module random_03480>],
    the first argument is:
    -1
    which is not in its domain.
---*)
