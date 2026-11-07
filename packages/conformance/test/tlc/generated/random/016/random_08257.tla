(*---
description: Evaluates a random int expression, seed 262, number 8257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b12783 \in (((CHOOSE f \in [{1} -> {1}] : TRUE) @@ ([a |-> 1] = [a |-> 1, b |-> TRUE])) \ UNION {({1} \cap 2..1), ({2, 1, 3} \cup {1, 2})}) : (UNION {({1} \cap SUBSET {1}), ({} \cup {x \in 1..3 : x > 1})} \subseteq [(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = [<<5, 6>> EXCEPT ![b12783] = b12783]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
---*)
