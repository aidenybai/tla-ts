(*---
description: Evaluates a random seq expression, seed 262, number 2052.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(((SubSeq(<<3, 1, 2>>, 2, 2147483647) \o <<-1, 7>>) \o SelectSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
---*)
