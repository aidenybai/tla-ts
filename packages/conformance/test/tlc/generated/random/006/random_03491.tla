(*---
description: Evaluates a random record expression, seed 262, number 3491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + Cardinality(SUBSET {1})] EXCEPT !.a = (CHOOSE b5517 \in UNION {{}, [x \in 1..2 |-> x]} : ({} = Nat))] EXCEPT !.a = (UNION {({2, 1, 3} \ {2, 1, 3}), (SUBSET {1} \cup {x \in 1..3 : x > 1})} \cup DOMAIN [(1 :> 2) EXCEPT ![-1] = 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03491 failed.
    Attempted to compare the function <<1, 2>> with the value:
    {}
---*)
