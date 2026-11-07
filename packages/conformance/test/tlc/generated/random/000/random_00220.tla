(*---
description: Evaluates a random seq expression, seed 262, number 220.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00220 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SubSeq(Append(<<>>, 2), Cardinality({1, 2}), Head(<<3, 1, 2>>)) \o <<(7 * 7), LET b358 == 1 IN b358>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2>>
    , but instead it is
    2
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2>>
    , but instead it is
    2
---*)
