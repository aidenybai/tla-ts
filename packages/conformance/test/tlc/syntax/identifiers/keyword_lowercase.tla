(*---
description: "Keywords are case sensitive, so lower case if is an identifier."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_lowercase ----
EXTENDS Naturals
if == 7
Test == if = 7
====

(*--- recorded
all:
  exit: 0
---*)
