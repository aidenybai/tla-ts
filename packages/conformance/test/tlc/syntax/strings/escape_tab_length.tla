(*---
description: "\\t reduces to one character."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escape_tab_length ----
EXTENDS Sequences, TLC
Test == Len("\t") = 1
====

(*--- recorded
all:
  exit: 0
---*)
