(*---
description: Evaluates a random int expression, seed 262, number 7780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((<<(7 + 0), (2147483647 \div 3)>> \o [(-1) EXCEPT ![1] = (1 * 1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07780 failed.
    Attempted to apply EXCEPT construct to the value -1.
---*)
