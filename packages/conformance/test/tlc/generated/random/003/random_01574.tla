(*---
description: Evaluates a random seq expression, seed 262, number 1574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(((CHOOSE b2514 \in {1 : b2515 \in {1}} : (~FALSE)) :> Len(SubSeq(<<3, 1, 2>>, 3, 7))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
