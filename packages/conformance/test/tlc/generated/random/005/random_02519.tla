(*---
description: Evaluates a random function expression, seed 262, number 2519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(IF TRUE THEN -1 ELSE 1 * (-1 - 7))) :> IF ((1 = -1) /\ (~FALSE)) THEN ((7 + 3) - (7 % 0)) ELSE (-[7 EXCEPT !.a = @ + 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02519 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
