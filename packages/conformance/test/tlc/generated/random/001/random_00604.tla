(*---
description: Evaluates a random set expression, seed 262, number 604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b1014 \in DOMAIN ([b1015 \in SUBSET {1} |-> b1015] @@ (CHOOSE f \in [2..1 -> {1}] : TRUE)) : (({b1014, b1014} \cup [[a |-> 1, b |-> TRUE] EXCEPT !.a = b1014]) \subseteq {(<<5, 6>> @@ <<5, 6>>), IF [a |-> 1, b |-> TRUE] THEN b1014 ELSE 1})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00604 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 211 to line 14, col 252 of module random_00604
---*)
