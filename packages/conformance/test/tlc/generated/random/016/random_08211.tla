(*---
description: Evaluates a random seq expression, seed 262, number 8211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(SubSeq([<<1, 2>> EXCEPT ![1] = 3], Head(<<3, 1, 2>>), CASE FALSE -> 3 [] OTHER -> 2147483647), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 2>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 2>>
    , but instead it is
    3
---*)
