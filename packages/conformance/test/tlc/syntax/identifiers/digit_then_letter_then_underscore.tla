(*---
description: A digit-led identifier may contain underscores after its first letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE digit_then_letter_then_underscore ----
EXTENDS Naturals
1a_ == 7
Test == 1a_ = 7
====

(*--- recorded
all:
  exit: 0
---*)
