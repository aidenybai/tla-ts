(*---
description: append of string_escapes, a StringValue, and string_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_string_escapes__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append("a\"b\\c\n", STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "a\"b\\c\n"
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "a\"b\\c\n"
---*)
