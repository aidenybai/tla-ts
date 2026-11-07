(*---
description: "[S -> T] = [U -> V] compares domains and ranges, so sets over Nat compare without enumeration."
ref: "tlc2/value/impl/SetOfFcnsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equal_nat_sets_by_parts ----
EXTENDS Integers
Test == [Nat -> Nat] = [Nat -> Nat]
====

(*--- recorded
all:
  exit: 0
---*)
