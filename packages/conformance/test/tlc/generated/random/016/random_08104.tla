(*---
description: Evaluates a random int expression, seed 262, number 8104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b12526 == CASE (DOMAIN [x \in 1..2 |-> x] = DOMAIN [x \in 1..2 |-> x]) -> CASE (\E b12527 \in 2..1 : FALSE) -> Head(<<1, 2>>) [] OTHER -> (2147483647 % 2147483647) [] OTHER -> Cardinality(UNION {{1}, {x \in 1..3 : x > 1}}) IN (CASE (~FALSE) -> Cardinality(1..3) [] OTHER -> (-1 - 7) - (-([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
