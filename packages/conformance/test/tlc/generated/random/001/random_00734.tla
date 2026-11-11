(*---
description: Evaluates a random record expression, seed 262, number 734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = Len((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o Append(<<3, 1, 2>>, 1)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 6]"
---*)
