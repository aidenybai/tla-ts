(*---
description: Parentheses add no structure.
ref: "tla2sany/parser/TLAplusParser.java#ParenExpr"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE parens_identity ----
Test == ((1)) = 1
====

(*--- recorded
all:
  exit: 0
---*)
