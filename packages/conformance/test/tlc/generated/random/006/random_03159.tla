(*---
description: Evaluates a random seq expression, seed 262, number 3159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(SelectSeq(SubSeq(<<1, 2>>, 2147483647, <<1>>), LAMBDA e : e > 0)) EXCEPT ![1] = (-IF (TRUE \in Nat) THEN Head(<<1, 2>>) ELSE (1 + 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1>>
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1>>
---*)
