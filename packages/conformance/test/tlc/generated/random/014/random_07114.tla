(*---
description: Evaluates a random record expression, seed 262, number 7114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + LET b10924 == 3 IN b10924] EXCEPT !.a = @ + ((CHOOSE b10925 \in {x \in 1..3 : x > 1} : TRUE) * (-7))] EXCEPT !.a = (([a |-> 2147483647, b |-> FALSE]).a - Cardinality({b10926 \in {1} : TRUE}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2147483646]"
---*)
