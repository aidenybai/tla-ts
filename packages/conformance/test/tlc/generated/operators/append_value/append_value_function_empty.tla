(*---
description: append_value applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, <<>>>>"
---*)
