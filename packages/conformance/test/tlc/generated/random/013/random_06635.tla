(*---
description: Evaluates a random record expression, seed 262, number 6635.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06635 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + Head(Append(Append(<<1, 2>>, 7), Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
