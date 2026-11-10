(*---
description: Evaluates a random record expression, seed 262, number 8677.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08677 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([b13429 \in Nat |-> -1])[Len(<<>>)], b |-> (~(~FALSE))] EXCEPT !.a = (CHOOSE b13430 \in UNION {(SUBSET {1} \cup 2..1), {b13431 \in 1..3 : TRUE}} : ((-1 \div 1) \in ({1} \cap SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08677 failed.
    Attempted to compare integer 1 with non-integer:
    {1}
---*)
