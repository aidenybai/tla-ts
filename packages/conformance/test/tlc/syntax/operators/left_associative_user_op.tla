(*---
description: + is left associative even when user-defined.
ref: "tla2sany/parser/Operators.java#CanonicalOperators"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE left_associative_user_op ----
a + b == <<a, b>>
Test == 1 + 2 + 3 = <<<<1, 2>>, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
