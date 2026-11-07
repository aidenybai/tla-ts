(*---
description: tail applied to string_set, a UserValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    STRING
    2283:0 The argument of Tail should be a sequence, but instead it is:
    STRING
---*)
