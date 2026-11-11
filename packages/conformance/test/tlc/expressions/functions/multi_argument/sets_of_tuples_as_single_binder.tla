(*---
description: "A plain binder over a set of pairs also takes the comma application."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: success
---*)
---- MODULE sets_of_tuples_as_single_binder ----
EXTENDS Integers
F == [p \in {1} \X {2} |-> p[1] + p[2]]
Test == F[1, 2] = 3
====

(*--- recorded
all:
  exit: 0
---*)
