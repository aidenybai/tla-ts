(*---
description: Evaluates a random int expression, seed 262, number 5942.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05942 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b9158 == IF (FALSE <=> TRUE) THEN (2 % [x \in Nat |-> x + 1]) ELSE LET b9159 == 2 IN 3 IN (-([x \in 1..2 |-> x])[b9158]) % UNION {{b9160 \in UNION {2..1, 2..1} : (TRUE <=> TRUE)}, DOMAIN (3 :> 2147483647)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05942 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
