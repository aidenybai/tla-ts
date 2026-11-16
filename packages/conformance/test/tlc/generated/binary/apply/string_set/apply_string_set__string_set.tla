(*---
description: apply of string_set, a UserValue, and string_set, a UserValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_set__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING)[STRING])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_set__string_set failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 31 of module apply_string_set__string_set
---*)
