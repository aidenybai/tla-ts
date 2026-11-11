(*---
description: Dot binds tighter than function application on the left.
ref: tla2sany/parser/Operators.java
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE dot_binds_tighter_than_prime_operand ----
Test == [a |-> <<7>>].a[1] = 7
====

(*--- recorded
all:
  exit: 0
---*)
