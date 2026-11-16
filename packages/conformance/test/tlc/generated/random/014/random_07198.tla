(*---
description: Evaluates a random bool expression, seed 262, number 7198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SelectSeq(<<>>, LAMBDA e : e > 0)) \div Cardinality(DOMAIN [x \in Nat |-> x + 1])) \in ({(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE), (0 + 1)} \cap {([a |-> 1, b |-> TRUE]).a, (7 - 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07198 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
