(*---
description: Evaluates a random record expression, seed 262, number 7030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(((FALSE => FALSE) \/ ({} \subseteq 2..1))), b |-> ((CHOOSE r \in [a : {}] : TRUE) = [a |-> [[x \in Nat |-> x + 1] EXCEPT ![2] = 7], b |-> (2 \in 2..1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE
---*)
