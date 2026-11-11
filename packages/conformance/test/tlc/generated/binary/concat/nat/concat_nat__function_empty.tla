(*---
description: concat of nat, a UserValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_nat__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) \o ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_nat__function_empty failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Nat
---*)
