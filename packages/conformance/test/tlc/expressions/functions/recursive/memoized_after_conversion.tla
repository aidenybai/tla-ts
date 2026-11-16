(*---
description: "After toFcnRcd a recursive function holds its record, so later applications do not run the body."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE memoized_after_conversion ----
EXTENDS Integers, TLC
F[n \in 1..2] == IF PrintT(n) /\ n = 1 THEN 1 ELSE F[n - 1]
Test == F = F /\ F[2] = 1 /\ F[2] = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 1
---*)
