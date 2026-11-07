(*---
description: Evaluates a random record expression, seed 262, number 3358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [[a |-> 1] EXCEPT !.a = 1])), b |-> (((2..1 \ 1..3) \subseteq {b5334 \in Nat : [a |-> 1, b |-> TRUE]}) /\ (\A b5335 \in UNION {<<5, 6>>, {}} : (~TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
