(*---
description: "\\n is not the letter n."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escape_newline_differs_from_n ----
EXTENDS Sequences, TLC
Test == "\n" # "n"
====

(*--- recorded
all:
  exit: 0
---*)
