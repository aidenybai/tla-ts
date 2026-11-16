(*---
description: "\\n, \\r, \\t, and \\f reduce to four different characters."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escapes_are_all_distinct ----
EXTENDS FiniteSets
Test == Cardinality({"\n", "\r", "\t", "\f"}) = 4
====

(*--- recorded
all:
  exit: 0
---*)
