(*---
description: Evaluates a random seq expression, seed 262, number 1771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head([SubSeq(<<>>, 0, 2147483647) EXCEPT ![1] = (2 \in 1..3)]), Head(<<Cardinality({1, 2}), (-0)>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01771 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
