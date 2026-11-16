(*---
description: Evaluates a random function expression, seed 262, number 4340.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04340 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6836 \in (Cardinality((1..3 \ 1..3)) .. ([<<3, 1, 2>> EXCEPT ![7] = 0])[Head((1 :> 2))]) |-> LET b6837 == DOMAIN (CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE) IN ([[x \in Nat |-> x + 1] EXCEPT ![1] = -1])[(-b6836)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 60 to line 14, col 70 of module random_04340
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04340 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 192 to line 14, col 196 of module random_04340>],
    the first argument is:
    -1
    which is not in its domain.
---*)
