(*---
description: apply of string_escapes, a StringValue, and int_maximum, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_escapes__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n")[2147483647])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_escapes__int_maximum failed.
    A non-function (a string) was applied as a function.
    line 14, col 16 to line 14, col 40 of module apply_string_escapes__int_maximum
---*)
