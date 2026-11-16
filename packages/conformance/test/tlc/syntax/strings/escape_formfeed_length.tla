(*---
description: "\\f reduces to one character."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escape_formfeed_length ----
EXTENDS Sequences, TLC
Test == Len("\f") = 1
====

(*--- recorded
all:
  exit: 0
---*)
