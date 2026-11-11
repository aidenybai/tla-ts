(*---
description: "An empty field set decides emptiness even when another field is Nat."
ref: "tlc2/value/impl/SetOfRcdsValue.java#isEmpty"
flags: [expression]
outcome: success
---*)
---- MODULE empty_field_with_nat_is_empty ----
EXTENDS Integers
Test == [a : {}, b : Nat] = {}
====

(*--- recorded
all:
  exit: 0
---*)
