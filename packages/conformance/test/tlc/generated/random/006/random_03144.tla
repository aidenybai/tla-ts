(*---
description: Evaluates a random record expression, seed 262, number 3144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = Len(Append(Append(<<3, 1, 2>>, 7), ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 5]"
---*)
