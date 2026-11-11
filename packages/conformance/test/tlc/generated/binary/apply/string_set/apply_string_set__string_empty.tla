(*---
description: apply of string_set, a UserValue, and string_empty, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_set__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING)[""])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_set__string_empty failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 27 of module apply_string_set__string_empty
---*)
