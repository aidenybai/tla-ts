(*---
description: A one letter identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE single_letter_upper ----
EXTENDS Naturals
X == 7
Test == X = 7
====

(*--- recorded
all:
  exit: 0
---*)
