(*---
description: Evaluates a random function expression, seed 262, number 6226.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06226 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({b9579 \in {1} : FALSE}) :> Cardinality((Nat \cup {}))) @@ ((LET b9580 == 1 IN b9580 \div (1 % 3)) % ((-2) * Tail(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06226 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
