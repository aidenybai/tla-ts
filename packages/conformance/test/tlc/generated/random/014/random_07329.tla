(*---
description: Evaluates a random seq expression, seed 262, number 7329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Len(Tail(<<1, 2>>)), (([a |-> 1, b |-> TRUE]).a \div ((1 :> 2))[1])>> \o ([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = ([a |-> 1]).a] \o SubSeq(SubSeq(<<1>>, 3, 2), (-0), Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07329 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
