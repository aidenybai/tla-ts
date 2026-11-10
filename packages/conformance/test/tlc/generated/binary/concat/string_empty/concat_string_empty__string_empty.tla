(*---
description: concat of string_empty, a StringValue, and string_empty, a StringValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \o (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ""'
---*)
