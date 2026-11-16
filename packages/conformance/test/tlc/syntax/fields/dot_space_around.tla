(*---
description: Whitespace may surround the record dot.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE dot_space_around ----
Test == [a |-> 1] . a = 1
====

(*--- recorded
all:
  exit: 0
---*)
