(*---
description: Evaluates a random int expression, seed 262, number 8012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = (-1 + 1)] EXCEPT !.a = Cardinality({<<>> : b12364 \in {}})]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
