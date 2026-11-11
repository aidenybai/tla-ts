(*---
description: A tab after spaces rounds up to the same stop as a tab alone.
ref: "tla2sany/parser/SimpleCharStream.java#UpdateLineColumn"
features: [junctions]
outcome: parse-error
---*)
---- MODULE space_then_tab_rounds_to_stop ----
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
    | line 10, col 12 to line 10, col 12 of module space_then_tab_rounds_to_stop
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
