(*---
description: "A filter over an enumerated set keeps exactly the elements whose predicate holds."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: success
---*)
---- MODULE reducible_keeps_elements ----
EXTENDS Integers
Test == {x \in {3, 1, 2} : x > 1} = {2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
