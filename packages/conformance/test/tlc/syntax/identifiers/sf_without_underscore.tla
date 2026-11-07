(*---
description: SF with no underscore is an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE sf_without_underscore ----
EXTENDS Naturals
SF == 7
Test == SF = 7
====

(*--- recorded
all:
  exit: 0
---*)
