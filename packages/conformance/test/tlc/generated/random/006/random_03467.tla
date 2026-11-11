(*---
description: Evaluates a random bool expression, seed 262, number 3467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((<<1, 2>> = (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)) /\ ((1 < 3) => (\A b5481 \in Nat : FALSE))) <=> ((Cardinality(Nat) \in {b5482 \in {2, 1, 3} : (1 :> 2)}) /\ (\A b5483 \in DOMAIN [x \in 1..2 |-> x] : (TRUE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03467 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 31 to line 14, col 66 of module random_03467
---*)
