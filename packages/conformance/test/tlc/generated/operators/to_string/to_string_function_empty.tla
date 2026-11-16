(*---
description: to_string applied to function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "<<>>"'
---*)
