(*---
description: Evaluates a random record expression, seed 262, number 659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a, b |-> (UNION {SUBSET {1}, 2..1} \subseteq DOMAIN [x \in 1..2 |-> x])] EXCEPT !.a = (CASE (~FALSE) -> (7 \div (1 :> 2)) [] OTHER -> (<<5, 6>> + 2147483647) - (Head(<<1>>) - Cardinality({1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00659 failed.
    Attempted to check if the value:
    {}
    is in the integer interval 1..2
---*)
