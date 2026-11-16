(*---
description: Evaluates a random set expression, seed 262, number 9256.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09256 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (-1 \div 0) [] OTHER -> (7 - 2147483647)) .. ((Len(<<>>) % (2147483647 - 1)) + (Cardinality({}) - LET b14367 == -1 IN b14367))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
