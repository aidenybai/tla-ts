(*---
description: "A kept-lazy function has no value cache, so applying it twice runs the body twice."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_body_runs_each_apply ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [x \in SUBSET {1} |-> P(1, x)][{}] = [x \in SUBSET {1} |-> P(2, x)][{}]
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
