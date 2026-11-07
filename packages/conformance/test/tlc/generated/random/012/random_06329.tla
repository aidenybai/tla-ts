(*---
description: Evaluates a random bool expression, seed 262, number 6329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> Head((FALSE /\ FALSE)), b |-> ([a |-> 7, b |-> TRUE] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE))] = [[[a |-> 2, b |-> 7] EXCEPT !.a = (7 * 1)] EXCEPT ![1] = CASE (FALSE \/ FALSE) -> (CHOOSE b9727 \in {} : FALSE) [] OTHER -> Len(<<1, 2>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
