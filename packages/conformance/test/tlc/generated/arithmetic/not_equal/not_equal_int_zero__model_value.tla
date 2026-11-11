(*---
description: /= of int_zero and model_value, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE not_equal_int_zero__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((0) /= (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
