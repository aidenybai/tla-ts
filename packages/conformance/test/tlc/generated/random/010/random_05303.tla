(*---
description: Evaluates a random seq expression, seed 262, number 5303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([a |-> Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), b |-> ([[a |-> 1] EXCEPT !.a = 1] = <<{1}, 3>>)], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05303 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<{1}, 3>>
---*)
