(*---
description: Evaluates a random bool expression, seed 262, number 4493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(CHOOSE b7061 \in 1..3 : TRUE) : b7060 \in {b7062 \in Nat : <<5, 6>>}} + Cardinality((Nat \cup SUBSET {1}))) \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04493 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
