(*---
description: Evaluates a random seq expression, seed 262, number 754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([b1237 \in ({2147483647, 2147483647} \ UNION {1..3, Nat}) |-> (Head(<<1>>) - IF [a |-> 1, b |-> TRUE] THEN -1 ELSE b1237)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00754 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
