(*---
description: "\\n reduces to one character."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escape_newline_length ----
EXTENDS Sequences, TLC
Test == Len("\n") = 1
====

(*--- recorded
all:
  exit: 0
---*)
