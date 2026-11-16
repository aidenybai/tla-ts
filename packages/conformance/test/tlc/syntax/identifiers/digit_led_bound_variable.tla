(*---
description: A digit-led identifier is a legal bound variable.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE digit_led_bound_variable ----
Test == \A 1x \in {1} : 1x = 1
====

(*--- recorded
all:
  exit: 0
---*)
