(*---
description: to_string applied to model_value, a ModelValue.
ref: tlc2/module/TLC.java#ToString
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
---- MODULE to_string_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(ToString(mv))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "mv"'
---*)
