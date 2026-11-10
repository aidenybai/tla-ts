(*---
description: The record dot may begin a new line.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE dot_newline ----
Test == [a |-> 1]
  .a = 1
====

(*--- recorded
all:
  exit: 0
---*)
