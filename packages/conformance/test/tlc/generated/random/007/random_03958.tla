(*---
description: Evaluates a random bool expression, seed 262, number 3958.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03958 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1}] : TRUE))[(3 \div 2)] \div LET b6227 == (3 \div 7) IN (b6227 % b6227)) \in {b6228 \in {(2 \div 1), (-1 \div 3)} : (~(\A b6229 \in {} : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03958 failed.
    Attempted to access record by a non-string argument: 1
---*)
