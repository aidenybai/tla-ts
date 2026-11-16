(*---
description: Evaluates a random record expression, seed 262, number 7953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (UNION {{2, 1, 3}, {1, 2}} = (2147483647 .. 1)), b |-> (({1, 2} = 3) /\ (1..3 = {}))] EXCEPT !.a = Head([[<<1, 2>> EXCEPT ![1] = -1] EXCEPT ![1] = (TRUE * 3)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07953 failed.
    Attempted to check equality of the set {1, 2} with the value:
    3
---*)
