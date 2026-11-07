(*---
description: Evaluates a random int expression, seed 262, number 5764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<(CHOOSE b8878 \in UNION {{1, 2}, <<3, 1, 2>>} : (TRUE => TRUE)), (IF TRUE THEN 0 ELSE 2147483647 * (3 + 3))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05764 failed.
    Attempted to compare the function <<3, 1, 2>> with the value:
    {1, 2}
---*)
