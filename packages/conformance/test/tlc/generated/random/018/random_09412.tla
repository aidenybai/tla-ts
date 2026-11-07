(*---
description: Evaluates a random seq expression, seed 262, number 9412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(Tail(<<1>>), [a |-> 2, b |-> TRUE], CASE TRUE -> 1 [] OTHER -> 2147483647) \o Tail(SubSeq(<<3, 1, 2>>, 3, [a |-> 1]))) \o (CHOOSE r \in [a : {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 2, b |-> TRUE]
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 2, b |-> TRUE]
---*)
