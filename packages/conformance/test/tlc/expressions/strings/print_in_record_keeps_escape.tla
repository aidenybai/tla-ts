(*---
description: "A nested string prints with its escapes."
ref: "tlc2/value/impl/StringValue.java#PrintVersion"
flags: [expression]
outcome: success
---*)
---- MODULE print_in_record_keeps_escape ----
EXTENDS Integers, TLC
Test == PrintT([zm |-> "a\nb"])
====

(*--- recorded
all:
  exit: 0
  transcript: '| [zm |-> "a\nb"]'
---*)
