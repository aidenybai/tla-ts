(*---
description: Evaluates a random int expression, seed 262, number 4160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-(CHOOSE b6549 \in (Nat \cap {2, 1, 3}) : ([a |-> 1, b |-> TRUE] => TRUE))), ([a |-> (-0), b |-> (~FALSE)]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04160 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a record.
    line 14, col 62 to line 14, col 90 of module random_04160
---*)
