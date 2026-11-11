(*---
description: Evaluates a random bool expression, seed 262, number 7837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(3 % 3) EXCEPT !.a = @ + (0 \div 7)]).a < (LET b12110 == (-2) IN (b12110 + b12110) * ((<<5, 6>> + 2147483647) \div Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07837 failed.
    Attempted to apply EXCEPT construct to the value 0.
---*)
