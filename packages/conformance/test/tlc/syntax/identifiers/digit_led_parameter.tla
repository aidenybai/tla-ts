(*---
description: A digit-led identifier is a legal parameter name.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE digit_led_parameter ----
Op(1p) == 1p
Test == Op(4) = 4
====

(*--- recorded
all:
  exit: 0
---*)
