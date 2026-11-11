(*---
description: Evaluates a random record expression, seed 262, number 4761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT ![1] = Len(<<>>)] * LET b7430 == (3 + -1) IN LET b7431 == 0 IN b7431)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04761 failed.
    Attempted to access record by a non-string argument: 1
---*)
