(*---
description: apply of string_a, a StringValue, and nat, a UserValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_a__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a")[Nat])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_a__nat failed.
    A non-function (a string) was applied as a function.
    line 14, col 16 to line 14, col 25 of module apply_string_a__nat
---*)
