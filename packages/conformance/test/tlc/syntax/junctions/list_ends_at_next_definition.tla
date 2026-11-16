(*---
description: The next definition at column one ends the list.
ref: "tla2sany/parser/TLAplusParser.java#belchDEF"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_ends_at_next_definition ----
Op ==
  /\ TRUE
  /\ TRUE
Test == Op
====

(*--- recorded
all:
  exit: 0
---*)
