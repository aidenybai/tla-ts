(*---
description: "Earlier bounds are not in scope of later sets in the set comprehension's order rule: a set may use an outer name only."
ref: "tla2sany/semantic/Generator.java#processQuantBoundArgs"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE bound_not_in_scope_of_own_set ----
y == {1}
Test == \A x \in y : x = 1
====

(*--- recorded
all:
  exit: 0
---*)
