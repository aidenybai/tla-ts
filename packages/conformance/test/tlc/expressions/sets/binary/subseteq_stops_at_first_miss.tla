(*---
description: "S \\subseteq T stops at the first element outside T, so the element that would fail is not asked about."
ref: "tlc2/value/impl/EnumerableValue.java#isSubsetEq"
flags: [expression]
outcome: success
---*)
---- MODULE subseteq_stops_at_first_miss ----
EXTENDS Integers
Test == ~({0, 5} \subseteq {y \in Nat : IF y = 5 THEN 1 \div 0 = 0 ELSE FALSE})
====

(*--- recorded
all:
  exit: 0
---*)
