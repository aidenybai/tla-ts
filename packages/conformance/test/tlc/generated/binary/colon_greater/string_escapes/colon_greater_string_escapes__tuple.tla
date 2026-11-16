(*---
description: colon_greater of string_escapes, a StringValue, and tuple, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_escapes__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") :> (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a\"b\\c\n" :> <<1, 2>>)'
---*)
