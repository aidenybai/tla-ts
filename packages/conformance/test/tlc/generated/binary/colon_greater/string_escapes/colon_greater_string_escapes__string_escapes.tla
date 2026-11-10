(*---
description: colon_greater of string_escapes, a StringValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_escapes__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") :> ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a\"b\\c\n" :> "a\"b\\c\n")'
---*)
