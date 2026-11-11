(*---
description: Evaluates a random int expression, seed 262, number 212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(Append([<<>> EXCEPT ![1] = 0], ([x \in Nat |-> x + 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 33 to line 14, col 36 of module random_00212
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00212 failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
