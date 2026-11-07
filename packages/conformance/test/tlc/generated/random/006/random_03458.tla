(*---
description: Evaluates a random seq expression, seed 262, number 3458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(Tail(Append(<<>>, -1)), (([a |-> 1, b |-> TRUE]).a :> Len(<<1>>)), ((2 * 2) * ([a |-> 1, b |-> TRUE]).a)), Head(Tail(SubSeq(<<1>>, 3, -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1>>
---*)
