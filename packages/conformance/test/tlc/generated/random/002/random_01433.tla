(*---
description: Evaluates a random bool expression, seed 262, number 1433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(CHOOSE b2294 \in Nat : TRUE), Head(<<>>)} \cup (([a |-> 1]).a .. CASE FALSE -> -1 [] OTHER -> -1)) \cup {(-(<<1>> + 1)), IF (TRUE <=> FALSE) THEN (0 + 2) ELSE ([a |-> 1, b |-> TRUE]).a}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01433 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 20 to line 14, col 46 of module random_01433
---*)
