(*---
description: append of union, a UnionValue, and string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_union__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(UNION {{1}, {2}}, "a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
---*)
