(*---
description: to_string applied to nat, a UserValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "Nat"'
---*)
