(*---
description: Evaluates a random record expression, seed 262, number 118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((-1 - 3) \div (<<5, 6>>)[2147483647]) % ((CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))[([x \in Nat |-> x + 1])[1]]), b |-> (\E b182 \in UNION {DOMAIN <<5, 6>>, UNION {{x \in 1..3 : x > 1}, 1..3}} : (CASE TRUE -> 1 [] OTHER -> 7 \in ({1, 2} \ Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00118 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
