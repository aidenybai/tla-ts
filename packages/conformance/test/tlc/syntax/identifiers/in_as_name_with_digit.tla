(*---
description: A digit makes a keyword into an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE in_as_name_with_digit ----
EXTENDS Naturals
IN1 == 7
Test == IN1 = 7
====

(*--- recorded
all:
  exit: 0
---*)
