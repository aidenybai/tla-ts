(*---
description: Evaluates a random int expression, seed 262, number 2996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4758 == (((2147483647 % 0) % (1 \div 7)) \div IF [<<3, 1, 2>> EXCEPT ![1] = 0] THEN (-FALSE) ELSE LET b4759 == 7 IN 1) IN (Len(<<b4758, 0>>) \div ((b4758 % 7) % (3 - 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02996 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
