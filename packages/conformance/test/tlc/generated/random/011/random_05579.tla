(*---
description: Evaluates a random set expression, seed 262, number 5579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-7) - (-0)) :> (-(CHOOSE b8637 \in Nat : FALSE))) \cap {b8638 \in {IF FALSE THEN 1 ELSE 0, ((1 :> 2))[3]} : ((CHOOSE f \in [{} -> {1, 2}] : TRUE) \/ ([a |-> 1] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05579 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 38 to line 14, col 65 of module random_05579
---*)
