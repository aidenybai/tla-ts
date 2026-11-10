(*---
description: Evaluates a random bool expression, seed 262, number 5112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<1, 2>> = [x \in 1..2 |-> x]) /\ (<<3, 1, 2>> = [x \in Nat |-> x + 1])) \/ ((0 .. 2) \subseteq (<<1>> \cap Nat))) /\ ((([a |-> 1, b |-> TRUE]).a \in ({} \ 2..1)) => (\A b7950 \in (TRUE \ {x \in 1..3 : x > 1}) : CASE FALSE -> b7950 [] OTHER -> b7950))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05112 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
