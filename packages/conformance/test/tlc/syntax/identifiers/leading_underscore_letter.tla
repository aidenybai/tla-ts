(*---
description: An identifier may begin with an underscore when it contains a letter.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE leading_underscore_letter ----
_a == 7
Test == _a = 7
====

(*--- recorded
all:
  exit: 0
---*)
