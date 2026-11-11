(*---
description: colon_greater of string_escapes, a StringValue, and int, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_escapes__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") :> (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a\"b\\c\n" :> Int)'
---*)
