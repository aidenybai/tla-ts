(*---
description: Evaluates a random bool expression, seed 262, number 8450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = Cardinality(2..1)]) < ((([a |-> 1]).a \div (CHOOSE b13078 \in {2, 1, 3} : TRUE)) - ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
