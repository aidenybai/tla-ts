(*---
description: subseteq_left applied to boolean_set, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_left_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BOOLEAN \subseteq {1, 2})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_left_boolean_set failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
