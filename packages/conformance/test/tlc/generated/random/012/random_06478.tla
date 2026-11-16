(*---
description: Evaluates a random seq expression, seed 262, number 6478.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06478 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(<<Head(<<3, 1, 2>>), IF FALSE THEN 2147483647 ELSE 0>>, CASE (FALSE <=> TRUE) -> (1 * 2) [] OTHER -> LET b9966 == 0 IN 7), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 7>>"
---*)
