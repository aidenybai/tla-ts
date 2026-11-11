(*---
description: Lower case wf_ is not the fairness token.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE lowercase_wf ----
EXTENDS Naturals
wf_a == 7
Test == wf_a = 7
====

(*--- recorded
all:
  exit: 0
---*)
