(*---
description: "SUBSET A \\subseteq SUBSET B reduces to A \\subseteq B, so it holds for B = Nat without enumerating anything infinite."
ref: "tlc2/value/impl/SubsetValue.java#isSubsetEq"
flags: [expression]
outcome: success
---*)
---- MODULE subseteq_reduces_to_base_sets ----
EXTENDS Integers
Test == (SUBSET {1, 2}) \subseteq (SUBSET Nat)
====

(*--- recorded
all:
  exit: 0
---*)
