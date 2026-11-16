(*---
description: Letters and digits mix after the first letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE trailing_digits ----
EXTENDS Naturals
a1b2 == 7
Test == a1b2 = 7
====

(*--- recorded
all:
  exit: 0
---*)
