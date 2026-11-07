(*---
description: Evaluates a random record expression, seed 262, number 9470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((3 < 2147483647) \/ (~FALSE)) -> ((-2147483647) \div (2147483647 - -1)) [] OTHER -> (LET b14717 == 7 IN 7 \div Head(<<1>>)), b |-> (((2147483647).a - LET b14718 == 0 IN b14718) - (Cardinality({x \in 1..3 : x > 1}) \div ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647--1
    2178:0 Overflow when computing 2147483647--1
---*)
