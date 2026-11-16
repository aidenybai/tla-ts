(*---
description: "Equal sets of records over Nat compare field by field without enumerating."
ref: "tlc2/value/impl/SetOfRcdsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE nat_fields_compare_by_parts ----
EXTENDS Integers
Test == [a : Nat] = [a : Nat]
====

(*--- recorded
all:
  exit: 0
---*)
