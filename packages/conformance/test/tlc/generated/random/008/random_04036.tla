(*---
description: Evaluates a random bool expression, seed 262, number 4036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = Cardinality({Len(<<1, 2>>) : b6347 \in {2147483647 : b6348 \in {1}}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
