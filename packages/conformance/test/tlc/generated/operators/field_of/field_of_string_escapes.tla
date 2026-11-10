(*---
description: field_of applied to string_escapes, a StringValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n").a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_string_escapes failed.
    Attempted to select field "a" from a non-record value "a\"b\\c\n"
    line 14, col 16 to line 14, col 30 of module field_of_string_escapes
---*)
