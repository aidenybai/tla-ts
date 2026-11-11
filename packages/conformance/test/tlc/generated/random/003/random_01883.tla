(*---
description: Evaluates a random seq expression, seed 262, number 1883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(<<(<<5, 6>>)[<<>>], ([x \in Nat |-> x + 1])[0]>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01883 failed.
    Attempted to access tuple at a non integral index: <<>>
---*)
