(*---
description: Evaluates a random bool expression, seed 262, number 840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b1367 \in {b1368 \in DOMAIN <<5, 6>> : (2..1 \subseteq {1})} : (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) \subseteq ({2, 1, 3} \cap SUBSET {1}))) <=> (((1 .. 0) \ DOMAIN [x \in Nat |-> x + 1]) = ({b1369 \in Nat : TRUE} \ (2..1 \cup SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00840 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
