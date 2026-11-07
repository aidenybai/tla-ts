(*---
description: Evaluates a random seq expression, seed 262, number 6467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(SubSeq(SubSeq(<<3, 1, 2>>, 1, 2147483647), (1..3 * 7), CASE TRUE -> 3 [] OTHER -> 2147483647)) EXCEPT ![1] = Head(<<(1 % 2), Len(<<3, 1, 2>>)>>)])
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
