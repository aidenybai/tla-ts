(*---
description: A word that merely ends with a keyword is an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_suffix ----
EXTENDS Naturals
xIF == 7
Test == xIF = 7
====

(*--- recorded
all:
  exit: 0
---*)
