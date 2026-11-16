(*---
description: Names that differ only by case are different symbols.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE case_sensitive_distinct ----
abc == 1
ABC == 2
Test == abc # ABC
====

(*--- recorded
all:
  exit: 0
---*)
