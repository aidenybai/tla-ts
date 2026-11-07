(*---
description: Evaluates a random seq expression, seed 262, number 884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append(SelectSeq(<<>>, LAMBDA e : e > 0), (\E b1429 \in {x \in 1..3 : x > 1} : FALSE))) \o <<(-(2147483647 - 1)), LET b1430 == IF TRUE THEN 1 ELSE 7 IN {b1431 \in {2, 1, 3} : TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-2147483646, {1, 2, 3}>>"
---*)
