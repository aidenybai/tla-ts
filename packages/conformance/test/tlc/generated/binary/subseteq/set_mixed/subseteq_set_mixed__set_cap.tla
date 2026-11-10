(*---
description: subseteq of set_mixed, a SetEnumValue, and set_cap, a SetCapValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_mixed__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, "a"}) \subseteq ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_set_mixed__set_cap failed.
    Attempted to compare string "a" with non-string:
    1
---*)
