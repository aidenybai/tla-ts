(*---
description: Evaluates a random set expression, seed 262, number 1920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[b3016 \in ({1} \ 1..3) |-> CASE FALSE -> [a |-> 1] [] OTHER -> 2] EXCEPT ![LET b3017 == Cardinality(1..3) IN (b3017 * 1)] = Head(<<7, 3>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 89 of module random_01920
    | {}
---*)
