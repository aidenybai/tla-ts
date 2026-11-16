(*---
description: "A function record checks domains before values, so incomparable values are not reached when the keys differ."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE values_compared_after_domain ----
EXTENDS Integers
Test == [x \in {1} |-> "a"] # [x \in {2} |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
