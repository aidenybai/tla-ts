(*---
description: subseteq of set_empty, a SetEnumValue, and string_escapes, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_empty__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \subseteq ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
