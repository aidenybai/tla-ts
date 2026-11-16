(*---
description: "Six closing angles lex as three >> tokens."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE triple_nesting ----
Test == <<<<<<1>>>>>>[1][1][1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
