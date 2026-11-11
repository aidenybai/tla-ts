(*---
description: colon_greater of nat, a UserValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (Nat :> "a\"b\\c\n")'
---*)
