(*---
description: "A string built at runtime reads a field written in the source."
ref: "tlc2/value/impl/RecordValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE runtime_string_finds_field ----
EXTENDS Integers, Sequences
Test == [ab |-> 1]["a" \o "b"] = 1
====

(*--- recorded
all:
  exit: 0
---*)
