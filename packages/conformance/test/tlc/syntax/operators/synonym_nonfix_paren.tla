(*---
description: "(+)(a, b) applies \\oplus in nonfix form even though the name holds parentheses."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_nonfix_paren ----
a \oplus b == a
Test == (+)(1, 2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
