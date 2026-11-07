(*---
description: Evaluates a random bool expression, seed 262, number 6718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{1, 1}, (1 .. 7)} = ((-1 .. 3) \ ({1} \ 2..1))) \/ (\E b10297 \in {b10298 \in DOMAIN [x \in 1..2 |-> x] : (TRUE /\ TRUE)} : (Len(1) = (b10297 + b10297)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    1
    2283:0 The argument of Len should be a sequence, but instead it is:
    1
---*)
