(*---
description: append of colon_greater, a FcnRcdValue, and string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_colon_greater__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1 :> 2, "a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<2, "a\"b\\c\n">>'
---*)
