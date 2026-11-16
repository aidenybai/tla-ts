(*---
description: Evaluates a random set expression, seed 262, number 2897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b4581 \in {(CHOOSE b4583 \in Nat : FALSE) : b4582 \in {b4584 : b4584 \in {1}}} : ((\E b4585 \in <<>> : FALSE) => (<<1, 2>> = (1 :> 2)))} \cup ({b4586 \in (TRUE /\ {}) : (-1 \in 1..3)} \ (DOMAIN [x \in Nat |-> x + 1] \cap ({2, 1, 3} \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02897 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 30 to line 14, col 57 of module random_02897
---*)
