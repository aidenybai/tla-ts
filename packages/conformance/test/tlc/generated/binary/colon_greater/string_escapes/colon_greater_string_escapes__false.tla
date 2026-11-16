(*---
description: colon_greater of string_escapes, a StringValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_escapes__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a\"b\\c\n" :> FALSE)'
---*)
