(*---
description: colon_greater of string_escapes, a StringValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_escapes__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a\"b\\c\n" :> 1..3)'
---*)
