(*---
description: "A carriage return prints as an escape."
ref: "tlc2/value/impl/StringValue.java#PrintVersion"
flags: [expression]
outcome: success
---*)
---- MODULE print_escape_return ----
EXTENDS Integers, TLC
Test == PrintT("a\rb")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\rb"'
---*)
