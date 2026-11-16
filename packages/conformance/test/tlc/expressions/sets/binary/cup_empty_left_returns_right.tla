(*---
description: "{} \\cup S returns S, so Nat survives intact."
ref: "tlc2/value/impl/SetEnumValue.java#cup"
flags: [expression]
outcome: success
---*)
---- MODULE cup_empty_left_returns_right ----
EXTENDS Integers
Test == ({} \cup Nat) = Nat
====

(*--- recorded
all:
  exit: 0
---*)
