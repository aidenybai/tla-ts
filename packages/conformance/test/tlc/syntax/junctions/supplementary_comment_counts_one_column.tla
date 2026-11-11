(*---
description: "A supplementary character in a comment before a bullet takes as many columns as the stream's code units."
ref: "tla2sany/parser/SimpleCharStream.java#UpdateLineColumn"
features: [junctions]
outcome: parse-error
---*)
---- MODULE supplementary_comment_counts_one_column ----
Test ==
         /\ \E z \in {1} : TRUE
(* 😀 *) /\ z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 13 to line 10, col 13 of module supplementary_comment_counts_one_column
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
