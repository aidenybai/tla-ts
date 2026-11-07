(*---
description: append of string_empty, a StringValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_string_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append("", [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    ""
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    ""
---*)
