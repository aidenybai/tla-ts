(*---
description: Evaluates a random record expression, seed 262, number 4898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b7629 \in ((1..3 \ {}) \cap ({1, 2} \cup SUBSET {1})) : ((<<>> \o <<1>>) < (0 * b7629))), b |-> ({([a |-> 1]).a, (3 - 0)} = ((~FALSE) \cap ({x \in 1..3 : x > 1} \cap {})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04898 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
