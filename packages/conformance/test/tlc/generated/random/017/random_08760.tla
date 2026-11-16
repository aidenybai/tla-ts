(*---
description: Evaluates a random int expression, seed 262, number 8760.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08760 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b13561 == IF ((2..1 = {1, 2}) <=> ([x \in 1..2 |-> x])[3]) THEN IF (FALSE <=> FALSE) THEN (7 + 2147483647) ELSE (2 = 2147483647) ELSE (IF {1, 2} THEN [a |-> 1, b |-> TRUE] ELSE 7 + (7 + 2)) IN {Len([<<>> EXCEPT ![1] = b13561]), ([a |-> 2, b |-> FALSE]).a})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 219 to line 14, col 222 of module random_08760
    | {0, 2}
---*)
