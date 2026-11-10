(*---
description: Evaluates a random int expression, seed 262, number 2696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> IF (TRUE => FALSE) THEN Head({}) ELSE IF FALSE THEN 0 ELSE 2147483647, b |-> ((Nat \subseteq {}) /\ (2 = 0))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02696 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 103 to line 14, col 118 of module random_02696
---*)
