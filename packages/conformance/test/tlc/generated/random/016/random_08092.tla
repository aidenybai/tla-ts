(*---
description: Evaluates a random record expression, seed 262, number 8092.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08092 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + (-(CHOOSE b12501 \in DOMAIN <<5, 6>> : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
