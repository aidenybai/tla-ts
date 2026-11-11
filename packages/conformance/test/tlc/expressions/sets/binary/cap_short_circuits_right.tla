(*---
description: "\\cap membership checks the right set only when the left holds the element."
ref: "tlc2/value/impl/SetCapValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE cap_short_circuits_right ----
EXTENDS Integers
Test == {5} \notin ((SUBSET {1}) \cap {y \in SUBSET Nat : 1 \div 0 = 0})
====

(*--- recorded
all:
  exit: 0
---*)
