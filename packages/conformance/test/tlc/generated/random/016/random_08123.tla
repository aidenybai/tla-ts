(*---
description: Evaluates a random seq expression, seed 262, number 8123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SubSeq([<<1>> EXCEPT ![1] = 1], (0 + 0), (~FALSE))), Head([[<<3, 1, 2>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]] EXCEPT ![1] = Head(<<>>)])))
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
