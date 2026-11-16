(*---
description: Evaluates a random bool expression, seed 262, number 7369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11338 \in [a |-> (-(CHOOSE b11339 \in FALSE : [a |-> 1, b |-> TRUE])), b |-> ((3 \in {}) <=> (\A b11340 \in {} : TRUE))] : (((Nat \subseteq {1}) => (~Nat)) <=> ((b11338 + 2) \in DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07369 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 41 to line 14, col 87 of module random_07369
---*)
