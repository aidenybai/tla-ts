(*---
description: Evaluates a random int expression, seed 262, number 8462.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08462 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<((CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE))[(FALSE /\ TRUE)], ((2..1 \cap 2..1) % (7 + -1))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08462 failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
