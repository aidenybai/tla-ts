(*---
description: subseteq of set_cap, a SetCapValue, and set_mixed, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_cap__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \subseteq ({1, "a"}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_set_cap__set_mixed failed.
    Attempted to check equality of string "a" with non-string:
    2
---*)
