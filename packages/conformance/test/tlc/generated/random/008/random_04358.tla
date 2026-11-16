(*---
description: Evaluates a random int expression, seed 262, number 4358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b6865 \in {(CHOOSE b6867 \in (2 .. -1) : (b6866 = b6867)) : b6866 \in {([a |-> 1, b |-> TRUE]).a, (7 * 1)}} : ([a |-> (b6865 * 2147483647), b |-> (~FALSE)] => (~(b6865 \in {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04358 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 36 to line 14, col 79 of module random_04358
---*)
