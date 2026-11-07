(*---
description: apply of function_strings, a FcnRcdValue, and string_a, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_strings__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x])["a"])
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a"'
---*)
