(*---
description: or_right applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_right_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE \/ [x \in {1}, y \in {2} |-> x + y])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module or_right_function_pair_domain failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 16 to line 14, col 56 of module or_right_function_pair_domain
---*)
