(*---
description: Evaluates a random record expression, seed 262, number 5893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = Cardinality(UNION {({1} \ {}), ({1} \ {1})})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
