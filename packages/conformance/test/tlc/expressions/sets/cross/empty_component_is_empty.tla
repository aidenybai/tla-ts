(*---
description: "A product with an empty component equals {}."
ref: "tlc2/value/impl/SetOfTuplesValue.java#isEmpty"
flags: [expression]
outcome: success
---*)
---- MODULE empty_component_is_empty ----
EXTENDS Integers
Test == {1} \X {} = {} /\ {} \X {1} = {}
====

(*--- recorded
all:
  exit: 0
---*)
