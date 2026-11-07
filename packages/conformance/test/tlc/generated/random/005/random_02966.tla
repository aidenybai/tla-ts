(*---
description: Evaluates a random bool expression, seed 262, number 2966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head(SubSeq(<<1>>, <<1, 2>>, 2147483647)), Cardinality({7, 2})} \subseteq UNION {((-1 % -1) .. Len(<<1, 2>>)), {(2 + b4705) : b4705 \in (2 .. SUBSET {1})}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
