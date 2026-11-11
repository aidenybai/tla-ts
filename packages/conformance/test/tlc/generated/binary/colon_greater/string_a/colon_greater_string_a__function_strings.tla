(*---
description: colon_greater of string_a, a StringValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| [a |-> [a |-> "a", b |-> "b"]]'
---*)
