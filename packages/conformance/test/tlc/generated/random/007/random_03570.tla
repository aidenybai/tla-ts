(*---
description: Evaluates a random record expression, seed 262, number 3570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + LET b5637 == (-(2 * 2)) IN (-Len(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -2]"
---*)
