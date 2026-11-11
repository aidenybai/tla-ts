(*---
description: apply of record_nested, a RecordValue, and string_escapes, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_record_nested__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]])["a\"b\\c\n"])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_record_nested__string_escapes failed.
    Attempted to access nonexistent field 'a"b\c
    ' of record
    [a |-> [b |-> <<1>>]]
---*)
