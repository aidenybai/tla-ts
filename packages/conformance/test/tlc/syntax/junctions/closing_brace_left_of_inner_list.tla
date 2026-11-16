(*---
description: "A } ends a list regardless of its column."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE closing_brace_left_of_inner_list ----
Test == {/\ TRUE
         /\ FALSE
} = {FALSE}
====

(*--- recorded
all:
  exit: 0
---*)
