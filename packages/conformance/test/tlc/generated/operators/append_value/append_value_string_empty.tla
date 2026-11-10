(*---
description: append_value applied to string_empty, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, ""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "">>'
---*)
