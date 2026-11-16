(*---
description: append of function, a FcnRcdValue, and string_a, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], "a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<2, 4, "a">>'
---*)
