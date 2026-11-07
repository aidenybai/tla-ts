(*---
description: Evaluates a random seq expression, seed 262, number 2425.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02425 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(<<LET b3829 == 1 IN <<1>>, Cardinality({1})>>, LAMBDA p, q : p < q), (CASE (-1 \in [a |-> 1]) -> (3 * 2) [] OTHER -> (-1 % 7) - ((<<3, 1, 2>> \div 2147483647) + (3 - 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    <<1>>
    2266:0 The second argument of < should be an integer, but instead it is:
    <<1>>
---*)
