(*---
description: Evaluates a random set expression, seed 262, number 2692.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02692 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4263 == (CHOOSE b4264 \in DOMAIN [x \in Nat |-> x + 1] : (~TRUE)) IN ([a |-> b4263, b |-> FALSE]).a .. Head(((0 \div 0) :> Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02692 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 31 to line 14, col 85 of module random_02692
---*)
