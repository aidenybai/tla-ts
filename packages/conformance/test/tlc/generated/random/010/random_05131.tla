(*---
description: Evaluates a random record expression, seed 262, number 5131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = Len(<<1>>)] EXCEPT !.a = @ + Len(<<0, 7>>)] EXCEPT !.a = Head(SortSeq(Append(<<>>, {1}), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> {1}]"
---*)
