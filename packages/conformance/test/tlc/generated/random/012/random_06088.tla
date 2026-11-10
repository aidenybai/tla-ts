(*---
description: Evaluates a random int expression, seed 262, number 6088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Cardinality(DOMAIN [(1 :> 2) EXCEPT ![2] = 1])))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 44 of module random_06088
    | -1
---*)
