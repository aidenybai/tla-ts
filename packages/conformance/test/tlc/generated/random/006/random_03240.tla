(*---
description: Evaluates a random set expression, seed 262, number 3240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b5154 \in DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x]) : ((FALSE \/ TRUE) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1]))}, Tail(Append(Append(<<3, 1, 2>>, {x \in 1..3 : x > 1}), (CHOOSE b5155 \in 2 : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03240 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 191 to line 14, col 216 of module random_03240
---*)
