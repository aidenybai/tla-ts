(*---
description: colon_greater of string_a, a StringValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| [a |-> "a\"b\\c\n"]'
---*)
