(*---
description: subseteq of boolean_set, a SetEnumValue, and string_a, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_boolean_set__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \subseteq ("a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_boolean_set__string_a failed.
    Attempted to check if the value:
    FALSE
    is an element of the string "a"
---*)
