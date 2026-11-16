(*---
description: Evaluates a random bool expression, seed 262, number 3298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(Append(<<1>>, -1) = [b5244 \in 1..3 |-> 1])) /\ ((DOMAIN [a |-> 1, b |-> TRUE] = (3 .. 2)) \/ ((FALSE \/ FALSE) \/ ({1} = Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03298 failed.
    Attempted to check equality of the set {1} with the value:
    Nat
---*)
