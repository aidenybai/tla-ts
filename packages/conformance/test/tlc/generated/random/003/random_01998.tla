(*---
description: Evaluates a random function expression, seed 262, number 1998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[b3166 \in UNION {2..1, {1}} |-> (-7)] EXCEPT ![IF (FALSE /\ TRUE) THEN (FALSE \/ TRUE) ELSE IF FALSE THEN 1 ELSE 2] = (-Head(<<>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 61 of module random_01998
    | {1}
---*)
