(*---
description: An underscore may follow a letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE inner_underscore ----
EXTENDS Naturals
a_b == 7
Test == a_b = 7
====

(*--- recorded
all:
  exit: 0
---*)
