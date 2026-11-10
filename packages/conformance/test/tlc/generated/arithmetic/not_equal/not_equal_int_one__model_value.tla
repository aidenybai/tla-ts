(*---
description: /= of int_one and model_value, including overflow and type errors.
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
---- MODULE not_equal_int_one__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((1) /= (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
