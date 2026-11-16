(*---
description: Dot may follow a parenthesized record.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE dot_after_parens ----
Test == ([a |-> 7]).a = 7
====

(*--- recorded
all:
  exit: 0
---*)
