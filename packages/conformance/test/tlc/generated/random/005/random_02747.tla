(*---
description: Evaluates a random record expression, seed 262, number 2747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE b4337 \in {2, 1, 3} : TRUE) + IF FALSE THEN -1 ELSE 2147483647) \div ((CHOOSE b4338 \in {} : TRUE) - (3 \div 7))), b |-> (~((-1 .. 0) = (FALSE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02747 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
