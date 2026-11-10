(*---
description: "BoolValue orders FALSE before TRUE."
ref: "tlc2/value/impl/BoolValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE false_less_than_true_in_order ----
EXTENDS Integers
Test == (CHOOSE b \in BOOLEAN : TRUE) = FALSE
====

(*--- recorded
all:
  exit: 0
---*)
