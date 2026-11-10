(*---
description: Evaluates a random bool expression, seed 262, number 1620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE) @@ [[b2583 \in {x \in 1..3 : x > 1} |-> b2583] EXCEPT ![([a |-> 1, b |-> TRUE]).a] = Cardinality(2..1)]) @@ [b2584 \in ({b2585 \in {} : FALSE} \ (0 .. 2)) |-> (({1, 2} % b2584) + ([a |-> 1]).a)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 72 to line 14, col 113 of module random_01620
    | (2 :> 1 @@ 3 :> 3)
---*)
