(*---
description: Evaluates a random int expression, seed 262, number 9736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (LET b15116 == 7 IN b15116 + (2147483647 + 0)), b |-> (~(\E b15117 \in {} : TRUE))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09736 failed.
    2178:0 Overflow when computing 7+2147483647
---*)
