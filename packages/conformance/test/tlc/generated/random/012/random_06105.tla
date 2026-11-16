(*---
description: Evaluates a random set expression, seed 262, number 6105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9394 \in {(-Len(<<1>>)) : b9395 \in (UNION {{1}, SUBSET {1}} \cap DOMAIN (1 :> 2))} : (\E b9396 \in ({b9394 : b9397 \in {x \in 1..3 : x > 1}} \cup (0 .. b9394)) : ((<<>> \subseteq Nat) => ([x \in Nat |-> x + 1] @@ (1 :> 2))))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06105 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 183 to line 14, col 200 of module random_06105
---*)
