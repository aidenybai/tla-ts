(*---
description: Digits and underscores may mix before the first letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE underscore_digit_letter ----
_1_a == 7
Test == _1_a = 7
====

(*--- recorded
all:
  exit: 0
---*)
