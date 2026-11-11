(*---
description: Evaluates a random int expression, seed 262, number 6975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10673 \in (CASE FALSE -> 7 [] OTHER -> 0 .. (2 \div 7)) : ((0 % 2) < (-2))) \div (LET b10674 == (-2147483647) IN (<<5, 6>>)[b10674] - LET b10675 == Head(<<>>) IN (b10675 % [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06975 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 99 of module random_06975
---*)
