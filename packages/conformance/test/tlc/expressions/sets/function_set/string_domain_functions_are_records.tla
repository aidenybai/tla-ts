(*---
description: "Enumerating a function set on strings yields values equal to records."
ref: "tlc2/value/impl/SetOfFcnsValue.java#Enumerator"
flags: [expression]
outcome: success
---*)
---- MODULE string_domain_functions_are_records ----
EXTENDS Integers
Test == [a |-> 1] \in {f \in [{"a"} -> {1}] : TRUE}
====

(*--- recorded
all:
  exit: 0
---*)
