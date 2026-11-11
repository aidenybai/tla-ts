(*---
description: Evaluates a random bool expression, seed 262, number 3584.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03584 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5650 \in (((2 .. 0) \cup ({} \cup 1..3)) \cap ((<<1, 2>> = [x \in 1..2 |-> x]) \cup DOMAIN <<5, 6>>)) : ((\A b5651 \in {1 : b5652 \in Nat} : (3 \in 1)) /\ (DOMAIN [x \in Nat |-> x + 1] \subseteq DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03584 failed.
    Attempted to check if the value:
    3
    is an element of the boolean TRUE
---*)
