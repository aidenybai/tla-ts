(*---
description: append of function_empty, a FcnRcdValue, and string_empty, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {} |-> x], ""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"">>'
---*)
