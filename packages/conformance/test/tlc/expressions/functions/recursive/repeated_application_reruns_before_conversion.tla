(*---
description: "Before conversion each application of a recursive function runs the body again."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE repeated_application_reruns_before_conversion ----
EXTENDS Integers, TLC
F[n \in 1..2] == IF PrintT(n) /\ n = 1 THEN 1 ELSE F[n - 1]
Test == F[2] = 1 /\ F[2] = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 2
    | 1
    | 2
    | 1
---*)
