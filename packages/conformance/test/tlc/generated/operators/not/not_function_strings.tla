(*---
description: not applied to function_strings, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_function_strings failed.
    Attempted to apply the operator ~ to a non-boolean
    (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN))
    line 14, col 16 to line 14, col 42 of module not_function_strings
---*)
