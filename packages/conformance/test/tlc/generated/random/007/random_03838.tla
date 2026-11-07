(*---
description: Evaluates a random record expression, seed 262, number 3838.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03838 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ([[a |-> 1] EXCEPT !.a = @ + 3]).a] EXCEPT !.a = @ + LET b6047 == (CHOOSE b6048 \in {b6049 : b6049 \in {x \in 1..3 : x > 1}} : (1 \in 1..3)) IN (Len([a |-> 1, b |-> TRUE]) % ([x \in Nat |-> x + 1])[1])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
