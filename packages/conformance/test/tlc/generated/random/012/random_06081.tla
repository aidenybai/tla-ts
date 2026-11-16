(*---
description: Evaluates a random seq expression, seed 262, number 6081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE r \in [a : 1..2] : TRUE), IF (\E b9364 \in {3, -1} : (b9364 < b9364)) THEN ((2 < 1))[(CHOOSE b9365 \in {1} : TRUE)] ELSE Head((0 * 3))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06081 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
---*)
