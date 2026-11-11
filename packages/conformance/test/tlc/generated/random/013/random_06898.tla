(*---
description: Evaluates a random record expression, seed 262, number 6898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Cardinality(1..3), b |-> (\E b10563 \in 2..1 : TRUE)] EXCEPT !.a = @ + Cardinality({[a |-> 1, b |-> TRUE] : b10564 \in {1}})] EXCEPT !.a = Head(([<<1, 2>> EXCEPT ![1] = 0] \o SortSeq(<<1>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> FALSE]"
---*)
