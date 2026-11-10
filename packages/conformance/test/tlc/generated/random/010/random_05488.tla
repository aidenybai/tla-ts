(*---
description: Evaluates a random function expression, seed 262, number 5488.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05488 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8489 \in DOMAIN [b8490 \in [<<>> EXCEPT ![1] = 3] |-> ([x \in 1..2 |-> x] + 0)] |-> ((Head(<<>>) \div Head(<<3, 1, 2>>)) + (IF TRUE THEN b8489 ELSE 7 * (-2147483647)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 46 to line 14, col 49 of module random_05488
    | [b8489 \in <<>> |-> <expression line 14, col 103 to line 14, col 183 of module random_05488>]
---*)
