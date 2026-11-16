(*---
description: "A tuple binder destructures each element."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder ----
EXTENDS Integers
Test == \A <<a, b>> \in {<<1, 2>>, <<3, 4>>} : a + 1 = b
====

(*--- recorded
all:
  exit: 0
---*)
