(*---
description: Evaluates a random record expression, seed 262, number 6687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(DOMAIN TRUE), b |-> (UNION {SUBSET {1}, 1..3} = (CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))] EXCEPT !.a = ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = IF FALSE THEN 1 ELSE 2]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06687 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 36 to line 14, col 46 of module random_06687
---*)
