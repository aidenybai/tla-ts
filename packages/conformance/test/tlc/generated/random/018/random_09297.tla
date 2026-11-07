(*---
description: Evaluates a random seq expression, seed 262, number 9297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<LET b14426 == Head(<<>>) IN Head(<<3, 1, 2>>), ((1 .. 7) \ {-1, 2147483647})>>, ((Len(<<>>) * (7 * 2147483647)) \div (([a |-> 1, b |-> TRUE] % -1) - IF [a |-> 1] THEN 2 ELSE 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 7*2147483647
    2178:0 Overflow when computing 7*2147483647
---*)
