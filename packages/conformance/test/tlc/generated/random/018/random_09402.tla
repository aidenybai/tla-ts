(*---
description: Evaluates a random bool expression, seed 262, number 9402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b14586 == 1 IN 0 < ([a |-> 1]).a) /\ (([a |-> 1] = [a |-> 1, b |-> TRUE]) /\ ({1} = 2..1))) <=> (~((0 \div 2147483647) = Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
