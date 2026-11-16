(*---
description: "\\\\n is a backslash and an n, two characters, not a newline."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escape_backslash_then_n ----
EXTENDS Sequences, TLC
Test == Len("\\n") = 2 /\ "\\n" # "\n"
====

(*--- recorded
all:
  exit: 0
---*)
