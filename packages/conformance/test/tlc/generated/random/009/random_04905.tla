(*---
description: Evaluates a random seq expression, seed 262, number 4905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq((SubSeq(<<3, 1, 2>>, 1, 7) \o SubSeq(<<1>>, 1, -1)), Head(SortSeq(<<1>>, LAMBDA p, q : p < q)), (-(<<5, 6>>)[7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04905 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
