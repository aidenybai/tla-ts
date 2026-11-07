(*---
description: A digit-led name may hold an underscore before its first letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE digit_underscore_letter ----
1_a == 7
Test == 1_a = 7
====

(*--- recorded
all:
  exit: 0
---*)
