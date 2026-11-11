(*---
description: "A form feed prints as an escape."
ref: "tlc2/value/impl/StringValue.java#PrintVersion"
flags: [expression]
outcome: success
---*)
---- MODULE print_escape_formfeed ----
EXTENDS Integers, TLC
Test == PrintT("a\fb")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\fb"'
---*)
