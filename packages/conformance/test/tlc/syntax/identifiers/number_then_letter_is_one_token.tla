(*---
description: "2x lexes as a single name rather than 2 times x, so its definition is used."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE number_then_letter_is_one_token ----
EXTENDS Naturals
x == 100
2x == 7
Test == 2x = 7
====

(*--- recorded
all:
  exit: 0
---*)
