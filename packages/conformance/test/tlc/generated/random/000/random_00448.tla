(*---
description: Evaluates a random bool expression, seed 262, number 448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b731 \in {Head(SelectSeq(<<>>, LAMBDA e : e > 0)), (-(2 + 2147483647))} : (\A b732 \in {b733 \in ({x \in 1..3 : x > 1} \ Nat) : (\E b734 \in 1..3 : TRUE)} : ((1..3 = 2) => (b732 => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
