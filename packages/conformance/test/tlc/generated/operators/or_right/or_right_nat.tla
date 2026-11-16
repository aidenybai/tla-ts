(*---
description: or_right applied to nat, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_right_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE \/ Nat)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module or_right_nat failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a special set constant.
    line 14, col 16 to line 14, col 27 of module or_right_nat
---*)
