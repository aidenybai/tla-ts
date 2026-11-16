(*---
description: "\\E stops at a witness, so a later malformed element is never destructured."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_stops_before_bad_element ----
EXTENDS Integers
Test == \E <<a, b>> \in {<<1, 2>>, <<1, 2, 3>>} : a = 1
====

(*--- recorded
all:
  exit: 0
---*)
