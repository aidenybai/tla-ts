(*---
description: "[x \\in S, y \\in T |-> e] evaluates e with x varying fastest."
ref: "tlc2/value/impl/FcnParams.java#Enumerator"
flags: [expression]
outcome: success
---*)
---- MODULE function_multi_domain_first_fastest ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [x \in 1..2, y \in 1..2 |-> P(<<x, y>>, 1)] = [x \in 1..2, y \in 1..2 |-> 1]
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 1>>
    | <<2, 1>>
    | <<1, 2>>
    | <<2, 2>>
---*)
