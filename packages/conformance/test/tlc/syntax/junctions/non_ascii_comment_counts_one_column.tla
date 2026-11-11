(*---
description: A BMP character in a comment before a bullet counts as one column.
ref: "tla2sany/parser/JunctionListContext.java#Column"
features: [junctions]
outcome: parse-error
---*)
---- MODULE non_ascii_comment_counts_one_column ----
Test ==
        /\ \E z \in {1} : TRUE
(* é *) /\ z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 12 to line 10, col 12 of module non_ascii_comment_counts_one_column
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
