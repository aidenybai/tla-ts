(*---
description: SUBSET may be followed by parentheses.
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_subset_op ----
Test == SUBSET({}) = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
