(*---
description: A numeric literal may be applied through a function.
ref: "tla2sany/parser/TLAplusParser.java#Number"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE literal_as_function_argument ----
Test == [i \in {\b1} |-> i][1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
