(*---
description: concat of function_strings, a FcnRcdValue, and string_empty, a StringValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_strings__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \o (""))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_function_strings__string_empty failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> "a", b |-> "b"]
---*)
