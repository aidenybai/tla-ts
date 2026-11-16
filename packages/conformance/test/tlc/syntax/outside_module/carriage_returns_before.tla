(*---
description: Carriage returns in text before the module are whitespace.
ref: "tla2sany/parser/TLAplusParser.java#CompilationUnit"
features: [outside_module]
flags: [expression]
outcome: success
---*)
words
more
---- MODULE carriage_returns_before ----
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
