(*---
description: Evaluates a random set expression, seed 262, number 4710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b7369 \in DOMAIN [[x \in 1..2 |-> x] EXCEPT ![7] = -1] |-> ((b7369 * 1) + (-2))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 42 to line 14, col 59 of module random_04710
    | 1..2
---*)
