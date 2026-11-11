(*---
description: Evaluates a random record expression, seed 262, number 2278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = Cardinality({(2147483647 % 2), (-7)})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
