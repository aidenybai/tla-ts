(*---
description: times_left applied to int_maximum, a IntValue.
ref: tlc2/module/Naturals.java#Times
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE times_left_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2147483647 * 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2
    2178:0 Overflow when computing 2147483647*2
---*)
