(*---
description: Underscores may repeat.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE double_underscore ----
EXTENDS Naturals
a__b == 7
Test == a__b = 7
====

(*--- recorded
all:
  exit: 0
---*)
