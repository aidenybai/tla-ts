(*---
description: subseteq of boolean_set, a SetEnumValue, and set_cup, a SetCupValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_boolean_set__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \subseteq ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_boolean_set__set_cup failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
