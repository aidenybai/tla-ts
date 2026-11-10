(*---
description: "A tuple binder and a plain bound can share a quantifier."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_with_plain_bound ----
EXTENDS Integers
Test == \E <<a, b>> \in {<<1, 2>>}, c \in {3} : a + b = c
====

(*--- recorded
all:
  exit: 0
---*)
