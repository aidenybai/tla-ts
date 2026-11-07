(*---
description: Evaluates a random bool expression, seed 262, number 4169.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04169 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b6557 \in UNION {{b6558 : b6558 \in FALSE}, (CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE)} : ((<<3, 1, 2>> = <<5, 6>>) /\ (FALSE /\ FALSE))) <=> (Len(Tail(<<3, 1, 2>>)) \in ({[x \in 1..2 |-> x] : b6559 \in {2, 1, 3}} \cap DOMAIN [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04169 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 57 to line 14, col 61 of module random_04169
---*)
