(*---
description: Evaluates a random record expression, seed 262, number 1944.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01944 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (TRUE => TRUE) THEN LET b3060 == 7 IN b3060 ELSE (0 \div 2), b |-> (~(FALSE => TRUE))] EXCEPT !.a = LET b3061 == (CHOOSE b3062 \in (SUBSET {1} \cup 1..3) : ({2, 1, 3} \subseteq {1, 2})) IN (CHOOSE b3063 \in UNION {2..1, SUBSET {1}} : ([a |-> 1] = TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01944 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    TRUE
---*)
