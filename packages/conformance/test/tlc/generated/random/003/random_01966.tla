(*---
description: Evaluates a random record expression, seed 262, number 1966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + IF (\A b3110 \in {x \in 1..3 : x > 1} : FALSE) THEN (2 % -1) ELSE (0 % 1)] EXCEPT !.a = (Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) - Cardinality({b3111 \in 2..1 : FALSE}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
