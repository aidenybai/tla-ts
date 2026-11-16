(*---
description: Evaluates a random record expression, seed 262, number 8963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + Head(Append(Tail(<<1, 2>>), LET b13898 == -1 IN b13898))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 4]"
---*)
