(*---
description: "A backslash prints as an escape."
ref: "tlc2/value/impl/StringValue.java#PrintVersion"
flags: [expression]
outcome: success
---*)
---- MODULE print_escape_backslash ----
EXTENDS Integers, TLC
Test == PrintT("a\\b")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\\b"'
---*)
