(*---
description: An underscore may end an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE trailing_underscore ----
EXTENDS Naturals
a_ == 7
Test == a_ = 7
====

(*--- recorded
all:
  exit: 0
---*)
