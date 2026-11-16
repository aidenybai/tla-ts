(*---
description: Evaluates a random seq expression, seed 262, number 4077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<((CHOOSE f \in [2..1 -> {1}] : TRUE))[(7 - 7)], SortSeq(([a |-> 1] = [a |-> 1]), LAMBDA p, q : p < q)>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04077 failed.
    Attempted to apply function:
    <<>>
    to argument 0, which is not in the domain of the function.
---*)
