(*---
description: Evaluates a random int expression, seed 262, number 7035.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((({1} \cap {1, 2}) \cap UNION {1..3, Nat})) - (CHOOSE b10788 \in {b10789 \in {2147483647 : b10790 \in <<1, 2>>} : ({1, 2} \subseteq Nat)} : ((b10788 :> 0) /\ IF FALSE THEN b10788 ELSE b10788))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07035 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
