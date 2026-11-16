(*---
description: "CHOOSE may bind a tuple pattern, and its value is the tuple."
ref: "tla2sany/parser/TLAplusParser.java#UnboundOrBoundChoose"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE bound_tuple_choose ----
Test == (CHOOSE <<x, y>> \in {<<1, 2>>} : x = 1) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
