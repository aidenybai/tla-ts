(*---
description: Evaluates a random record expression, seed 262, number 9259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (CHOOSE b14369 \in ({b14370 \in SUBSET {1} : TRUE} \cup UNION {2..1, [a |-> 1]}) : {b14371 \in {b14369, 1} : (\A b14372 \in {1} : TRUE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09259 failed.
    Attempted to compare record:
    [a |-> 1]
    with non-record
    {}
---*)
