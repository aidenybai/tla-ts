(*---
description: UNION may be followed by parentheses.
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_union_op ----
Test == UNION({{1}}) = {1}
====

(*--- recorded
all:
  exit: 0
---*)
