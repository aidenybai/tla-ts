(*---
description: "---- inside a string is text and does not end a definition."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE dash_run_inside ----
EXTENDS Sequences, TLC
Test == Len("----") = 4
====

(*--- recorded
all:
  exit: 0
---*)
