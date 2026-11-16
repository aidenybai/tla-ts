(*---
description: A digit-led identifier is a legal record field.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE digit_led_field_name ----
Test == [1a |-> 3].1a = 3
====

(*--- recorded
all:
  exit: 0
---*)
