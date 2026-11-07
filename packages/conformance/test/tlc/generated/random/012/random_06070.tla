(*---
description: Evaluates a random set expression, seed 262, number 6070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 1 ELSE 1 * (2147483647 * 2147483647)) - LET b9349 == (-1 + 2) IN UNION {{2, 1, 3}, {2, 1, 3}}) :> (LET b9350 == Cardinality({}) IN CASE TRUE -> b9350 [] OTHER -> -1 \div ((3 % 2) + Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2147483647
    2178:0 Overflow when computing 2147483647*2147483647
---*)
