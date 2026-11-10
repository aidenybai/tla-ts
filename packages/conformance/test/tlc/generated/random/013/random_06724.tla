(*---
description: Evaluates a random seq expression, seed 262, number 6724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(Tail(SubSeq(<<1>>, 0, 3))), Len([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = ([a |-> 1]).a]), ([Head(<<3, 1, 2>>) EXCEPT !.a = @ + (3 - -1)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06724 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
---*)
