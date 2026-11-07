(*---
description: "* of int_minimum and int_minimum, including overflow and type errors."
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE times_int_minimum__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) * ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -2147483648*-2147483648
    2178:0 Overflow when computing -2147483648*-2147483648
---*)
