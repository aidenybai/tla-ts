(*---
description: Evaluates a random int expression, seed 262, number 4755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({CASE ({1, 2} \subseteq 1..3) -> (<<5, 6>>)[b7426] [] OTHER -> (b7426 \div b7426) : b7426 \in {(7 + 0), CASE FALSE -> -1 [] OTHER -> 0}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04755 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
