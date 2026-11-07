(*---
description: Evaluates a random seq expression, seed 262, number 4736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[LET b7402 == 1 IN b7402], [a |-> ([x \in 1..2 |-> x])[-1], b |-> (FALSE \/ TRUE)]>> EXCEPT ![1] = (IF (\E b7403 \in Nat : TRUE) THEN (1 - 3) ELSE (7 % 3) - ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04736 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
