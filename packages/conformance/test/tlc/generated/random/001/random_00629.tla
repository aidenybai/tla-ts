(*---
description: Evaluates a random set expression, seed 262, number 629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{([{2, 1, 3} EXCEPT ![-1] = 2])[(2 - 2)], Cardinality((2..1 \ Nat))}, DOMAIN [b1054 \in (3 .. 0) |-> (b1054 - 7)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00629 failed.
    Attempted to apply EXCEPT construct to the value {1, 2, 3}.
---*)
