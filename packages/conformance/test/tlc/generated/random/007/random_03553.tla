(*---
description: Evaluates a random set expression, seed 262, number 3553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b5619 \in (({1, 2} \cup SUBSET {1}) \cap UNION {{2, 1, 3}, {x \in 1..3 : x > 1}}) : (\E b5620 \in UNION {[a |-> 1], SUBSET {1}} : (<<1>> = [x \in Nat |-> x + 1]))} \cup (([a |-> 7, b |-> TRUE]).a .. Cardinality(({1} \ [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03553 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
