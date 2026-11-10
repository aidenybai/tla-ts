(*---
description: Asks whether string_empty is in string_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_string_set__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \in (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
