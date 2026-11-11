(*---
description: Evaluates a random bool expression, seed 262, number 6670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10227 \in (({b10228 \in {2, 1, 3} : TRUE} \subseteq DOMAIN [x \in 1..2 |-> x]) <=> (UNION {{1, 2}, {2, 1, 3}} \subseteq DOMAIN [x \in Nat |-> x + 1])) : ({b10229 \in (1..3 \ {}) : (TRUE /\ FALSE)} = ((<<5, 6>>)[b10227] .. SortSeq(<<1>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06670 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 32 to line 14, col 169 of module random_06670
---*)
