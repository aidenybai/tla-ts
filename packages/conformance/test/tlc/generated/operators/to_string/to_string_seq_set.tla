(*---
description: to_string applied to seq_set, a UserValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "Seq({1})"'
---*)
