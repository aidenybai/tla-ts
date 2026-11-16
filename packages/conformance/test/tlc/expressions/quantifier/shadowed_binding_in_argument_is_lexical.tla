(*---
description: "A quantifier binding reaches an operator argument lexically, so the callees variable of the same name does not capture it."
ref: "tlc2/util/Context.java#lookup"
flags: [expression]
outcome: success
---*)
---- MODULE shadowed_binding_in_argument_is_lexical ----
EXTENDS Integers
F(z) == \E y \in {2} : z = y
Test == \A y \in {1} : ~F(y)
====

(*--- recorded
all:
  exit: 0
---*)
