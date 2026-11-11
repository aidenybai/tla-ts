(*---
description: An identifier of letters.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE letters_only ----
EXTENDS Naturals
abc == 7
Test == abc = 7
====

(*--- recorded
all:
  exit: 0
---*)
