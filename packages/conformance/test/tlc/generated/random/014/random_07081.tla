(*---
description: Evaluates a random int expression, seed 262, number 7081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 - 3) % (-3)) :> IF (\A b10875 \in SUBSET {1} : TRUE) THEN Cardinality({2, 1, 3}) ELSE (-0)))[(IF (3 = 1) THEN [(1 :> 2) EXCEPT ![2147483647] = 3] ELSE (0 * 2) % ((1 * 0) \div (7 * 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07081 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -3
---*)
