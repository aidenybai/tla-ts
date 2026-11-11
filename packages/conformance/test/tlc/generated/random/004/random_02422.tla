(*---
description: Evaluates a random record expression, seed 262, number 2422.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02422 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = LET b3825 == SelectSeq(Append(<<>>, 3), LAMBDA e : e > 0) IN ([[a |-> 1] EXCEPT !.a = 1]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
