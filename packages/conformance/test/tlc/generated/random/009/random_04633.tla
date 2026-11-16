(*---
description: Evaluates a random seq expression, seed 262, number 4633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(((Len(<<1>>) - (Nat \subseteq {x \in 1..3 : x > 1})) \div ([a |-> 1, b |-> <<3, 1, 2>>]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04633 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 37 to line 14, col 70 of module random_04633
---*)
