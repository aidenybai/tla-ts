(*---
description: Evaluates a random bool expression, seed 262, number 3476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(<<DOMAIN [x \in 1..2 |-> x], IF TRUE THEN 1 ELSE 0>>) = ((CHOOSE f \in [{} -> 1..2] : TRUE) @@ (LET b5491 == 1 IN b5491 :> LET b5492 == 2..1 IN b5492))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03476 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
