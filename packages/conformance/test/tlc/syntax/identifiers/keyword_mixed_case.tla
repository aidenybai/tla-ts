(*---
description: "Keywords are case sensitive, so Then is an identifier."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_mixed_case ----
EXTENDS Naturals
Then == 7
Test == Then = 7
====

(*--- recorded
all:
  exit: 0
---*)
