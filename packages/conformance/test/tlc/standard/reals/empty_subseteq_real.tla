(*---
description: "{} \\subseteq Real is TRUE: with no elements, membership in the string is never asked."
ref: tlc2/value/impl/EnumerableValue.java#isSubsetEq
features:
  - Reals
flags:
  - expression
outcome: success
---*)
---- MODULE empty_subseteq_real ----
EXTENDS Reals
Test == {} \subseteq Real
====

(*--- recorded
all:
  exit: 0
---*)
