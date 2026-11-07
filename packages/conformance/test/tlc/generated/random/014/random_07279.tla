(*---
description: Evaluates a random bool expression, seed 262, number 7279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (~FALSE) THEN Head(<<>>) ELSE IF TRUE THEN 2147483647 ELSE -1 - Len(Tail(<<1, 2>>))) \in UNION {DOMAIN (-1 :> 1), (DOMAIN [x \in 1..2 |-> x] \ {b11210 : b11210 \in {2, 1, 3}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
