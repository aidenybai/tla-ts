(*---
description: Evaluates a random bool expression, seed 262, number 6726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 * 2147483647) \div ([a |-> 1, b |-> TRUE]).a) :> CASE (\E b10310 \in SUBSET {1} : FALSE) -> (-1 % 7) [] OTHER -> Len(<<1, 2>>)))[(([(1 :> 2) EXCEPT ![7] = {1, 2}])[LET b10311 == 7 IN b10311] % ((<<5, 6>>)[3] + Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 156 to line 14, col 161 of module random_06726
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06726 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
