(*---
description: apply of string_escapes, a StringValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_escapes__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n")[{1, 2} \ {2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_escapes__set_diff failed.
    A non-function (a string) was applied as a function.
    line 14, col 16 to line 14, col 42 of module apply_string_escapes__set_diff
---*)
