(*---
description: A raw tab inside a string is one character.
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE raw_tab_inside ----
EXTENDS Sequences, TLC
Test == Len("a	b") = 3 /\ "a	b" = "a\tb"
====

(*--- recorded
all:
  exit: 0
---*)
