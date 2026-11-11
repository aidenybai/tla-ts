(*---
description: Compares string_escapes, a StringValue, with colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_escapes__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") = (1 :> 2))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_escapes__colon_greater failed.
    Attempted to check equality of string "a\"b\\c\n" with non-string:
    <<2>>
---*)
