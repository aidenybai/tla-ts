(*---
description: A keyword first field may be followed by ordinary fields.
ref: "tla2sany/parser/TLAplusParser.java#SBracketCases"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_first_then_plain ----
Test == [IF |-> 1, a |-> 2].a = 2
====

(*--- recorded
all:
  exit: 0
---*)
