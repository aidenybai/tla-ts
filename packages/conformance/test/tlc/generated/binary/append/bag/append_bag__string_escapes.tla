(*---
description: append of bag, a FcnRcdValue, and string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), "a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a\"b\\c\n">>'
---*)
