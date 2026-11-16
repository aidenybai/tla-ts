(*---
description: Any number of leading digits may precede the first letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE many_leading_digits ----
EXTENDS Naturals
123a == 7
Test == 123a = 7
====

(*--- recorded
all:
  exit: 0
---*)
