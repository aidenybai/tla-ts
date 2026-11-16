(*---
description: A non-ASCII character in a string counts as one character.
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE non_ascii_counts_utf16_units ----
EXTENDS Sequences, TLC
Test == Len("é") = 1
====

(*--- recorded
all:
  exit: 0
---*)
