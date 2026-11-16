(*---
description: "A string prints with quotes."
ref: "tlc2/value/impl/StringValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE print_quoted ----
EXTENDS Integers, TLC
Test == PrintT("a b")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a b"'
---*)
