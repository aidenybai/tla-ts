(*---
description: Evaluates a random bool expression, seed 262, number 9435.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09435 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append((-1 \o <<>>), Head(<<>>)) = (-(7 * 0))) \/ (\E b14644 \in (DOMAIN [x \in Nat |-> x + 1] \cap {b14645 \in {x \in 1..3 : x > 1} : FALSE}) : ((\A b14646 \in SUBSET {1} : FALSE) /\ (TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
---*)
