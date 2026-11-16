(*---
description: "Two names may share one bound, and the next bound is separate."
ref: "tla2sany/parser/TLAplusParser.java#QuantBound"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE shared_bound_two_names ----
Test == \A x, y \in {1}, z \in {2} : x = y /\ z = 2
====

(*--- recorded
all:
  exit: 0
---*)
