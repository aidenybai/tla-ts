(*---
description: Evaluates a random seq expression, seed 262, number 6833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((SelectSeq(SubSeq(<<3, 1, 2>>, 0, 3), LAMBDA e : e > 0) \o SubSeq(Tail(<<>>), Head(<<>>), CASE FALSE -> 2 [] OTHER -> 3)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
