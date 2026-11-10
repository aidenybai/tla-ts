(*---
description: "Without Naturals the .. name is undefined, so the interval needs a user definition."
ref: tla2sany/parser/Operators.java
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE interval_no_naturals_needed ----
a .. b == {a, b}
Test == 1..2 = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
