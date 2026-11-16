(*---
description: if_condition applied to function, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_ite
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE if_condition_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF [x \in {1, 2} |-> x * 2] THEN 1 ELSE 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module if_condition_function failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 16 to line 14, col 56 of module if_condition_function
---*)
