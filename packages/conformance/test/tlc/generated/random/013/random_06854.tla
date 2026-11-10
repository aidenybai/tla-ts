(*---
description: Evaluates a random int expression, seed 262, number 6854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq([Tail(<<1, 2>>) EXCEPT ![1] = Len(<<>>)], ([[a |-> 1] EXCEPT !.a = @ + 1]).a, (~({x \in 1..3 : x > 1} = SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06854 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
