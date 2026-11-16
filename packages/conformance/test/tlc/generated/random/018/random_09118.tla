(*---
description: Evaluates a random int expression, seed 262, number 9118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE))[((-1 % 2147483647) * (2 + 7))] \div ((CASE TRUE -> 2 [] OTHER -> 7 * (0 % 7)) \div ((-1 :> 3))[(-1 * 1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09118 failed.
    2178:0 Overflow when computing 2147483646*9
---*)
