(*---
description: "^ applied to a parenthesized power computes the inner power first."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: success
---*)
---- MODULE right_associative ----
EXTENDS Integers
Test == 2 ^ (3 ^ 2) = 512 /\ (2 ^ 3) ^ 2 = 64
====

(*--- recorded
all:
  exit: 0
---*)
