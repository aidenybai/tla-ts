(*---
description: é differs from e.
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE non_ascii_not_equal_to_ascii ----
EXTENDS Sequences, TLC
Test == "é" # "e"
====

(*--- recorded
all:
  exit: 0
---*)
