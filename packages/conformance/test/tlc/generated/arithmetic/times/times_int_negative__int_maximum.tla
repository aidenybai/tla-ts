(*---
description: "* of int_negative and int_maximum, including overflow and type errors."
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE times_int_negative__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) * (2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -3*2147483647
    2178:0 Overflow when computing -3*2147483647
---*)
