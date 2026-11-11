(*---
description: "A recursive function has no cache until it is converted, so a repeated subcall reruns its body."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE no_memoization_before_enumeration ----
EXTENDS Integers, TLC
F[n \in 0..2] == IF PrintT(n) /\ n = 0 THEN 0 ELSE F[n - 1] + F[n - 1]
Test == F[2] = 0
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 2
    | 1
    | 0
    | 0
    | 1
    | 0
    | 0
---*)
