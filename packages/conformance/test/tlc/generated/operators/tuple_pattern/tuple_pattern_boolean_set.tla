(*---
description: tuple_pattern applied to boolean_set, a SetEnumValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in BOOLEAN})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2170:0 Argument mismatch in operator application.%1
    2170:0 Argument mismatch in operator application.%1
---*)
