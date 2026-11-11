(*---
description: and_right applied to function_strings, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_right_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE /\ [x \in {"a", "b"} |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_right_function_strings failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 16 to line 14, col 47 of module and_right_function_strings
---*)
