(*---
description: Evaluates a random int expression, seed 262, number 3637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b5748 \in {1, FALSE} : (1..3 \cup {1})) /\ (\E b5749 \in UNION {{2, 1, 3}, {1, 2}} : [[x \in Nat |-> x + 1] EXCEPT ![b5749] = -1]))).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03637 failed.
    Attempted to compare boolean FALSE with non-boolean:
    1
---*)
