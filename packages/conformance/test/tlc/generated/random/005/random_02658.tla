(*---
description: Evaluates a random seq expression, seed 262, number 2658.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02658 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((DOMAIN [[x \in 1..2 |-> x] EXCEPT ![3] = 1] = ({b4194 : b4194 \in {x \in 1..3 : x > 1}} \cap ({1, 2} \cap 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 30 to line 14, col 47 of module random_02658
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
