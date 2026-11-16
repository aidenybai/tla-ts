(*---
description: "<<x>> with no underscore after it is a tuple."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE angle_action_lookalike ----
Test == <<1>>[1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
