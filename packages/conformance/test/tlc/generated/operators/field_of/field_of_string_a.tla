(*---
description: field_of applied to string_a, a StringValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a").a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_string_a failed.
    Attempted to select field "a" from a non-record value "a"
    line 14, col 16 to line 14, col 22 of module field_of_string_a
---*)
