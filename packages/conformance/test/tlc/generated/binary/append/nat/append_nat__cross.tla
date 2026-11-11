(*---
description: append of nat, a UserValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_nat__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Nat, {1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_nat__cross failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Nat
---*)
