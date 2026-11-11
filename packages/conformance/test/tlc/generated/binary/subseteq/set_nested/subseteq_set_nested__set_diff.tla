(*---
description: subseteq of set_nested, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_nested__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \subseteq ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_set_nested__set_diff failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
