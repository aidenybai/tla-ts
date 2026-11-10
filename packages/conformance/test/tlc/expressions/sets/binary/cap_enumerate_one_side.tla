(*---
description: "Enumerating \\cap needs only one enumerable side, even with a non-Reducible one."
ref: "tlc2/value/impl/SetCapValue.java#Enumerator"
flags: [expression]
outcome: success
---*)
---- MODULE cap_enumerate_one_side ----
EXTENDS Integers
Test == {x \in ((SUBSET {1}) \cap (SUBSET Nat)) : TRUE} = {{}, {1}}
====

(*--- recorded
all:
  exit: 0
---*)
