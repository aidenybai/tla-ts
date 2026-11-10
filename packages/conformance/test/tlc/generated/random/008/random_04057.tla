(*---
description: Evaluates a random set expression, seed 262, number 4057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<3, 1, 2>>) + ([a |-> 1, b |-> TRUE]).a) + LET b6386 == (CHOOSE b6387 \in {} : FALSE) IN Cardinality({2, 1, 3})) .. CASE ((Nat \subseteq {}) \/ (7 < 0)) -> (-Head(<<3, 1, 2>>)) [] OTHER -> (([x \in 1..2 |-> x])[2147483647] + Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04057 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 147 to line 14, col 162 of module random_04057
---*)
