(*---
description: Evaluates a random bool expression, seed 262, number 5.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((<<1>> = [x \in Nat |-> x + 1]) <=> (Nat \subseteq {x \in 1..3 : x > 1}))) /\ (((\E b7 \in {x \in 1..3 : x > 1} : FALSE) /\ ({2, 1, 3} \subseteq {})) /\ ((-0) \in {b8 \in {1} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00005 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
