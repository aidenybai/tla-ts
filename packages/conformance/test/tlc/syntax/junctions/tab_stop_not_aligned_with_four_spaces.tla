(*---
description: "A tab moves past four spaces, so a bullet after it lies right of the list and stays in the item."
ref: "tla2sany/parser/SimpleCharStream.java#UpdateLineColumn"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE tab_stop_not_aligned_with_four_spaces ----
Test ==
    /\ \E z \in {1} : TRUE
	/\ z = 1
====

(*--- recorded
all:
  exit: 0
---*)
