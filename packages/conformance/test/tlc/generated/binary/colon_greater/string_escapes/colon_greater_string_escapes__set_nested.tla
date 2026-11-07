(*---
description: colon_greater of string_escapes, a StringValue, and set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_escapes__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") :> ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a\"b\\c\n" :> {{}, {1}})'
---*)
