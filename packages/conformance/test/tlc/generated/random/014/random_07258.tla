(*---
description: Evaluates a random bool expression, seed 262, number 7258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 % 7) :> ([a |-> 1]).a))[(-(2147483647 % 2))] \in (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a < IF (TRUE <=> FALSE) THEN LET b11165 == (1 :> 2) IN b11165 ELSE (-1 - 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07258 failed.
    Attempted to apply function:
    (6 :> 1)
    to argument -1, which is not in the domain of the function.
---*)
