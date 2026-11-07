(*---
description: "A tuple binder over the empty set runs no body."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_empty_set ----
EXTENDS Integers
Test == \A <<a, b>> \in {} : 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
