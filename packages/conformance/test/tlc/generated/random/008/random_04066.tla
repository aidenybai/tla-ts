(*---
description: Evaluates a random set expression, seed 262, number 4066.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 1 [] OTHER -> 1 + ([x \in Nat |-> x + 1])[3]) .. ((7 \div 2147483647) * (<<5, 6>>)[-1])) \cap {b6402 \in UNION {DOMAIN [x \in Nat |-> x + 1], {7, 0}} : ((\A b6403 \in {1, 2} : TRUE) /\ ({1} = {}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04066 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
