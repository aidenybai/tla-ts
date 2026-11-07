(*---
description: Evaluates a random seq expression, seed 262, number 4928.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04928 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((SelectSeq(SubSeq(<<1>>, -1, 0), LAMBDA e : e > 0) \o [SubSeq(<<>>, 0, 2147483647) EXCEPT ![1] = (-1)]), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
