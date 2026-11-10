(*---
description: "\"\" has length zero."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE empty_is_empty_sequence ----
EXTENDS Sequences, TLC
Test == Len("") = 0
====

(*--- recorded
all:
  exit: 0
---*)
