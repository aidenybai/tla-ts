(*---
description: Evaluates a random bool expression, seed 262, number 5491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 - 0) = Len(<<3, 1, 2>>)) => (Tail(<<>>) = [[x \in Nat |-> x + 1] EXCEPT ![TRUE] = 3])) => ((([x \in Nat |-> x + 1])[7] - LET b8492 == 2 IN b8492) < (Cardinality(1..3) \div (7 + 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
