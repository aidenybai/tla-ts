(*---
description: concat of nat, a UserValue, and interval_empty, a IntervalValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_nat__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) \o (3..1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Nat
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Nat
---*)
