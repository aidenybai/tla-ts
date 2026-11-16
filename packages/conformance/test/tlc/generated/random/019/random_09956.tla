(*---
description: Evaluates a random int expression, seed 262, number 9956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b15481 == IF (<<2147483647, 2147483647>> = ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])) THEN Head(<<-1, 0>>) ELSE ((2 * 0) \div LET b15482 == 7 IN b15482) IN Head(Append(<<b15481, b15481>>, ([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
