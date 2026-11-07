(*---
description: Evaluates a random bool expression, seed 262, number 1629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\A b2601 \in {b2602 : b2602 \in {1, 2}} : (~FALSE)) -> ((CHOOSE b2603 \in {1} : TRUE) \div (-3)) [] OTHER -> (Len(<<3, 1, 2>>) % (1 % -1)) \in (({1, 1} \cup (FALSE /\ FALSE)) \ DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
