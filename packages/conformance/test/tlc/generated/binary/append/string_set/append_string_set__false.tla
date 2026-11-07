(*---
description: append of string_set, a UserValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_string_set__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(STRING, FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    STRING
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    STRING
---*)
