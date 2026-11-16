(*---
description: Evaluates a random int expression, seed 262, number 1431.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01431 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2288 == ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a IN Len([[1..3 EXCEPT ![1] = 0] EXCEPT ![1] = Head(b2288)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01431 failed.
    Attempted to apply EXCEPT construct to the value 1..3.
---*)
