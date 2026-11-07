(*---
description: tuple_pattern applied to set_diff, a SetDiffValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in {1, 2} \ {2}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2170:0 Argument mismatch in operator application.%1
    2170:0 Argument mismatch in operator application.%1
---*)
