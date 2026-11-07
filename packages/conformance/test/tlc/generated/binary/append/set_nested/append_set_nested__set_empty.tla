(*---
description: append of set_nested, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_nested__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({{1}, {}}, {}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}}
---*)
