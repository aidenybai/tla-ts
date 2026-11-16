(*---
description: "A function over Nat runs its body for each application through the same definition."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE nat_function_body_runs_per_apply ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == LET f == [x \in Nat |-> P(x, x)] IN f[1] + f[1] + f[2] = 4
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 1
    | 2
---*)
