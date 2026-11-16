(*---
description: "A one-component tuple binder matches one-element tuples."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_one_component ----
EXTENDS Integers
Test == \E <<a>> \in {<<1>>} : a = 1
====

(*--- recorded
all:
  exit: 0
---*)
