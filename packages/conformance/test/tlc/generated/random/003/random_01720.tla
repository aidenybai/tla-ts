(*---
description: Evaluates a random set expression, seed 262, number 1720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN ((0 = 0) :> (-7)), {(((1 :> 2))[7] * Head(<<>>)) : b2737 \in {b2738 \in (0 .. 2147483647) : ({1, 2} \subseteq {1, 2})}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01720 failed.
    Attempted to construct a set with too many elements (>1000000).
---*)
