(*---
description: "Arguments are evaluated in the order the body uses them."
ref: "tlc2/value/impl/LazyValue.java"
flags: [expression]
outcome: success
---*)
---- MODULE argument_order_follows_body ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
F(a, b) == b - a
Test == F(P(1, 1), P(2, 3)) = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 2
    | 1
---*)
