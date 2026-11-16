(*---
description: "The reduced form of SUBSET A \\subseteq SUBSET B can be false."
ref: "tlc2/value/impl/SubsetValue.java#isSubsetEq"
flags: [expression]
outcome: success
---*)
---- MODULE subseteq_reduced_false ----
EXTENDS Integers
Test == ~((SUBSET {-1}) \subseteq (SUBSET Nat))
====

(*--- recorded
all:
  exit: 0
---*)
