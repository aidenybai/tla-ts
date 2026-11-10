(*---
description: cap of boolean_set, a SetEnumValue, and string_escapes, a StringValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_boolean_set__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \cap ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_boolean_set__string_escapes failed.
    Attempted to check if the value:
    FALSE
    is an element of the string "a\"b\\c\n"
---*)
