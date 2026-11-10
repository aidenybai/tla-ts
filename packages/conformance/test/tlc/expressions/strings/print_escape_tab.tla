(*---
description: "A tab prints as an escape."
ref: "tlc2/value/impl/StringValue.java#PrintVersion"
flags: [expression]
outcome: success
---*)
---- MODULE print_escape_tab ----
EXTENDS Integers, TLC
Test == PrintT("a\tb")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\tb"'
---*)
