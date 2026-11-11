(*---
description: "\\cup of finite non-Reducible sets converts and dedupes on comparison."
ref: "tlc2/value/impl/SetCupValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE cup_lazy_of_finite ----
EXTENDS Integers
Test == (SUBSET {1} \cup SUBSET {1, 2}) = SUBSET {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
