(*---
description: colon_greater of string_escapes, a StringValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_escapes__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") :> ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a\"b\\c\n" :> [a |-> 1, b |-> 2])'
---*)
