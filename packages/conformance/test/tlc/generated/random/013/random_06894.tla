(*---
description: Evaluates a random record expression, seed 262, number 6894.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06894 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b10557 \in DOMAIN [<<5, 6>> EXCEPT ![[a |-> 1, b |-> TRUE]] = 0] : (~(FALSE /\ FALSE))), b |-> (DOMAIN (<<5, 6>> @@ <<5, 6>>) = UNION {([x \in 1..2 |-> x] \cap 7), ({} \ 1..3)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06894 failed.
    Attempted to access tuple at a non integral index: [a |-> 1, b |-> TRUE]
---*)
