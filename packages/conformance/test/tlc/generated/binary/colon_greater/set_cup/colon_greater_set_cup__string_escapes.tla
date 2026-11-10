(*---
description: colon_greater of set_cup, a SetCupValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cup__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) :> ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({1, 2} :> "a\"b\\c\n")'
---*)
