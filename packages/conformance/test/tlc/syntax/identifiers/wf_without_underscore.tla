(*---
description: WF with no underscore is an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE wf_without_underscore ----
EXTENDS Naturals
WF == 7
Test == WF = 7
====

(*--- recorded
all:
  exit: 0
---*)
