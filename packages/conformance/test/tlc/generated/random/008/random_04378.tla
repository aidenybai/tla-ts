(*---
description: Evaluates a random seq expression, seed 262, number 4378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (2 % 2), (3 - 2))), (Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) % ((CHOOSE f \in [{2, 1, 3} -> {}] : TRUE))[({x \in 1..3 : x > 1} \cap 1..3)])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04378 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
