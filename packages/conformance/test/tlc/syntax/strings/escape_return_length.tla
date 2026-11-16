(*---
description: "\\r reduces to one character."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escape_return_length ----
EXTENDS Sequences, TLC
Test == Len("\r") = 1
====

(*--- recorded
all:
  exit: 0
---*)
