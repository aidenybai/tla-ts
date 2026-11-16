(*---
description: "∧ takes one column, so an inner list after ∧ with one space begins at column two past it."
ref: "tla2sany/parser/JunctionListContext.java#Column"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE unicode_nested_one_column_wide ----
Test ==
  ∧ ∧ TRUE
    ∧ TRUE
  ∧ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
