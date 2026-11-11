(*---
description: apply of colon_greater, a FcnRcdValue, and string_escapes, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_colon_greater__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2)["a\"b\\c\n"])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_colon_greater__string_escapes failed.
    Attempted to check equality of integer 1 with non-integer:
    "a\"b\\c\n"
---*)
