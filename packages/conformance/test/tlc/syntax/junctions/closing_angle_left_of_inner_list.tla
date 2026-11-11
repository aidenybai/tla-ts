(*---
description: "A >> ends a list regardless of its column."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE closing_angle_left_of_inner_list ----
Test == <</\ TRUE
          /\ FALSE
>>[1] = FALSE
====

(*--- recorded
all:
  exit: 0
---*)
