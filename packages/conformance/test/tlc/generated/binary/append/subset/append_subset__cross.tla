(*---
description: append of subset, a SubsetValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_subset__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SUBSET {1, 2}, {1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}, {2}, {1, 2}}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}, {2}, {1, 2}}
---*)
