(*---
description: concat of string_escapes, a StringValue, and subset, a SubsetValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_escapes__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") \o (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_string_escapes__subset failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    {{}, {1}, {2}, {1, 2}}
---*)
