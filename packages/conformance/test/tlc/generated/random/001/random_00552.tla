(*---
description: Evaluates a random record expression, seed 262, number 552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Cardinality({1}), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])] EXCEPT !.a = @ + IF (Nat = Nat) THEN (-1 - 3) ELSE (1 - 7)] EXCEPT !.a = SortSeq([b939 \in DOMAIN (1 :> 2) |-> Len([a |-> 1, b |-> TRUE])], LAMBDA p, q : p < q)])
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
