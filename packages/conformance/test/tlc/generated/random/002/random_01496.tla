(*---
description: Evaluates a random int expression, seed 262, number 1496.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01496 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(Append(<<1, 2>>, 7), LAMBDA e : e > 0)) \div (((<<5, 6>>)[7] + ([x \in 1..2 |-> x])[0]) + (CHOOSE b2388 \in (1..3 \ Nat) : (2147483647 = b2388)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01496 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
