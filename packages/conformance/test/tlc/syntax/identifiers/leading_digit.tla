(*---
description: An identifier may begin with a digit when a letter follows.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE leading_digit ----
EXTENDS Naturals
1a == 7
Test == 1a = 7
====

(*--- recorded
all:
  exit: 0
---*)
