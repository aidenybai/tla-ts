(*---
description: "A LET value used by a lazy function body evaluates when the function applies."
ref: "tlc2/value/impl/LazyValue.java"
flags: [expression]
outcome: success
---*)
---- MODULE let_value_in_lazy_function ----
EXTENDS Integers
Test == LET k == 2 IN [y \in Nat |-> y + k][3] = 5
====

(*--- recorded
all:
  exit: 0
---*)
