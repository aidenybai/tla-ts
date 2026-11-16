(*---
description: "A user operator evaluates an argument only when its body reaches the parameter."
ref: "tlc2/value/impl/LazyValue.java"
flags: [expression]
outcome: success
---*)
---- MODULE function_argument_lazy_body_order ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
F(a, b) == b + a
Test == F(P(1, 1), P(2, 2)) = 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 2
    | 1
---*)
