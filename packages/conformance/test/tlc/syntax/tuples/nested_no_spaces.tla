(*---
description: "<<<< and >>>> lex as pairs of brackets."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE nested_no_spaces ----
Test == <<<<1>>>>[1][1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
