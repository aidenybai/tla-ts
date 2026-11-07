(*---
description: Evaluates a random record expression, seed 262, number 6540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + LET b10054 == (-3) IN Len(<<1>>)] EXCEPT !.a = @ + [b10055 \in SelectSeq(SubSeq([a |-> 1, b |-> TRUE], -1, 3), LAMBDA e : e > 0) |-> (CHOOSE b10056 \in {b10055, b10055} : (TRUE <=> TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
