(*---
description: append of nat, a UserValue, and set_diff, a SetDiffValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_nat__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Nat, {1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Nat
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Nat
---*)
