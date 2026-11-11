(*---
description: Evaluates a random int expression, seed 262, number 1111.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01111 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(({b1776 : b1776 \in 1..3} \ ({1, 2} \ Nat)), ([<<5, 6>> EXCEPT ![-1] = 2147483647])[([x \in Nat |-> x + 1])[2]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 75 to line 14, col 82 of module random_01111
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01111 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
