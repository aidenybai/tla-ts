(*---
description: subseteq of set_filter, a SetPredValue, and string_escapes, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_filter__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \subseteq ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_set_filter__string_escapes failed.
    Attempted to check if the value:
    2
    is an element of the string "a\"b\\c\n"
---*)
