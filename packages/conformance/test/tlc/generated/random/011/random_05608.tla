(*---
description: Evaluates a random bool expression, seed 262, number 5608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a], LAMBDA p, q : p < q) = (([a |-> -1, b |-> FALSE]).a :> (IF TRUE THEN 2147483647 ELSE 2147483647 % (-3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
