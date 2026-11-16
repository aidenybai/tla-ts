(*---
description: Evaluates a random record expression, seed 262, number 5934.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05934 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Len(<<>>), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])] EXCEPT !.a = @ + (([a |-> 1]).a * (3 - 7))] EXCEPT !.a = @ + Cardinality(({b9144 \in 1..3 : TRUE} \ ({2, 1, 3} \cup SUBSET {1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -4, b |-> FALSE]"
---*)
