(*---
description: append of set_nested, a SetEnumValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_nested__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({{1}, {}}, [x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_set_nested__function_pair_domain failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}}
---*)
