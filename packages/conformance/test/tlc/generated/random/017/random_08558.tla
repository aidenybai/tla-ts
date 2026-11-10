(*---
description: Evaluates a random set expression, seed 262, number 8558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((-1 .. 3) \cup {b13259 \in 1..3 : TRUE})) .. ((UNION {Nat, {2, 1, 3}} = UNION {SUBSET {1}, 1..3}) - ((2 - 3) % (2 + 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08558 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
