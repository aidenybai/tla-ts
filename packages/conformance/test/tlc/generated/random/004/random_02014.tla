(*---
description: Evaluates a random int expression, seed 262, number 2014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<(CHOOSE b3192 \in [<<5, 6>> EXCEPT ![{2, 1, 3}] = 3] : (2147483647 = b3192)), ((-0) * (CHOOSE b3193 \in {1} : TRUE))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02014 failed.
    Attempted to access tuple at a non integral index: {1, 2, 3}
---*)
