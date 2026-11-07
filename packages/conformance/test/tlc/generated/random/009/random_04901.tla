(*---
description: Evaluates a random function expression, seed 262, number 4901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-0) * (2 * 2147483647)) \div (({} + 3) * (<<5, 6>>)[FALSE])) :> (((2147483647 % 0) :> (CHOOSE b7633 \in {x \in 1..3 : x > 1} : TRUE)))[CASE (~TRUE) -> (7 % 2147483647) [] OTHER -> (-0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*2147483647
    2178:0 Overflow when computing 2*2147483647
---*)
