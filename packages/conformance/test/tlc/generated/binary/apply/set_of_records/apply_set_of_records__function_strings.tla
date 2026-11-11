(*---
description: apply of set_of_records, a SetOfRcdsValue, and function_strings, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_set_of_records__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}])[[x \in {"a", "b"} |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_set_of_records__function_strings failed.
    A non-function (a set of the form [d1 : S1, ... , dN : SN]) was applied as a function.
    line 14, col 16 to line 14, col 55 of module apply_set_of_records__function_strings
---*)
