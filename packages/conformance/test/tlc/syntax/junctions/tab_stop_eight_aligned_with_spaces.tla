(*---
description: "A tab advances to column 8, so it aligns with eight spaces."
ref: "tla2sany/parser/SimpleCharStream.java#UpdateLineColumn"
features: [junctions]
outcome: parse-error
---*)
---- MODULE tab_stop_eight_aligned_with_spaces ----
Test ==
        /\ \E z \in {1} : TRUE
	/\ z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 12 to line 10, col 12 of module tab_stop_eight_aligned_with_spaces
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
