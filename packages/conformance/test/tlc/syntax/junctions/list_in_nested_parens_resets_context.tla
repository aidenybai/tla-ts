(*---
description: "Parentheses do not reset the column rule: a nested list keeps its own column."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_in_nested_parens_resets_context ----
Test ==
  /\ (\/ TRUE
      \/ FALSE)
  /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
