(*---
description: A character outside the basic plane has the same length as two Java chars.
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE non_ascii_supplementary_length ----
EXTENDS Sequences, TLC
Test == Len("😀") = 2
====

(*--- recorded
all:
  exit: 0
---*)
