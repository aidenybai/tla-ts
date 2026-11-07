(*---
description: Evaluates a random set expression, seed 262, number 9685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b15023 == (Len(<<1>>) - (2147483647 \div 3)) IN (Cardinality((1 :> 2)) = Head(<<3, 1, 2>>)), (CASE (TRUE <=> FALSE) -> (1 * 2147483647) [] OTHER -> IF FALSE THEN 2147483647 ELSE 2147483647 \div ((7 - 7) \div (2147483647 :> -1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<2>>
    2181:0 Attempted to compute cardinality of the value
    <<2>>
---*)
