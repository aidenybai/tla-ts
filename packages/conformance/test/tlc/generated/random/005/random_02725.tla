(*---
description: Evaluates a random seq expression, seed 262, number 2725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[SortSeq(<<1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<1>>)] EXCEPT ![1] = CASE (2 = 1) -> (3 + -1) [] OTHER -> Len(<<3, 1, 2>>)] \o SubSeq([(<<1, 2>> \o <<1>>) EXCEPT ![1] = (3 + 2)], (-(1 + 1)), Cardinality(({1} \cup 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<5, 2, 1>>
    , but instead it is
    -2
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<5, 2, 1>>
    , but instead it is
    -2
---*)
