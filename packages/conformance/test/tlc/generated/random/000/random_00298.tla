(*---
description: Evaluates a random record expression, seed 262, number 298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = IF TRUE THEN 0 ELSE 2147483647] EXCEPT !.a = Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))] EXCEPT !.a = @ + Len(Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3]"
---*)
