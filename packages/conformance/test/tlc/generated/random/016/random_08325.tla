(*---
description: Evaluates a random set expression, seed 262, number 8325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\A b12877 \in {2, 0} : (-1 = b12877)) THEN (({} * 2147483647) + Head(<<>>)) ELSE ((CHOOSE b12878 \in {1} : TRUE) % (1 * 2)) .. (LET b12879 == CASE TRUE -> 2 [] OTHER -> -1 IN (b12879 + -1) % ((0 + -1) \div (7 \div 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
