(*---
description: Evaluates a random int expression, seed 262, number 8182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b12653 \in UNION {{x \in 1..3 : x > 1}, SUBSET {1}} : (~b12653)) \/ ((\E b12654 \in SUBSET {1} : TRUE) /\ (<<1>> = [x \in Nat |-> x + 1])))).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08182 failed.
    Attempted to compare the set {} with the value:
    2
---*)
