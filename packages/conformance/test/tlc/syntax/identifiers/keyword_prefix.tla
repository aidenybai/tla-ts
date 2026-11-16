(*---
description: A word that merely begins with a keyword is an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_prefix ----
EXTENDS Naturals
IFF == 7
Test == IFF = 7
====

(*--- recorded
all:
  exit: 0
---*)
