(*---
description: Evaluates a random seq expression, seed 262, number 4200.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04200 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<Head(SubSeq(<<>>, 2, TRUE)), ((<<5, 6>> @@ [x \in Nat |-> x + 1]))[LET b6608 == 3 IN 7]>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    TRUE
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
