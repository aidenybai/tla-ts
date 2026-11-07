(*---
description: Evaluates a random bool expression, seed 262, number 7821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Cardinality(SUBSET {1}), b |-> (-1 = 0)] = [[<<1>> EXCEPT !.a = @ + 2] EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a]) => (\E b12073 \in {Head(<<1>>) : b12074 \in {2147483647, 2147483647}} : ([a |-> b12073, b |-> FALSE] = (CHOOSE r \in [a : {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07821 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
