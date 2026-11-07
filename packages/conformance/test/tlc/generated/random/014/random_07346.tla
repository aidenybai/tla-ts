(*---
description: Evaluates a random bool expression, seed 262, number 7346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + SubSeq(<<1, 2>>, [a |-> 1], 2147483647)] EXCEPT !.a = @ + ((CHOOSE b11303 \in {} : TRUE) % Head(<<>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
