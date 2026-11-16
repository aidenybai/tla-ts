(*---
description: "A LET value that fails is harmless if a lazy function body does not use it for the applied argument."
ref: "tlc2/value/impl/LazyValue.java"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_error_in_captured_value_unused ----
EXTENDS Integers
Test == LET k == 1 \div 0 IN [y \in Nat |-> IF y = 0 THEN 0 ELSE k][0] = 0
====

(*--- recorded
all:
  exit: 0
---*)
