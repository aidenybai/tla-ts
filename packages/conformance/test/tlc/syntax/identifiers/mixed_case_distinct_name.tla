(*---
description: Identifiers are case sensitive.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE mixed_case_distinct_name ----
EXTENDS Naturals
aBc == 7
Test == aBc = 7
====

(*--- recorded
all:
  exit: 0
---*)
