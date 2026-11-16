(*---
description: Evaluates a random record expression, seed 262, number 7642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((-Cardinality(SUBSET {1})) - ((1 % 7) \div Cardinality(SUBSET {1}))), b |-> ((Append(<<1>>, 1) = (3 :> 2)) \/ ((2..1 \cup 2..1) = UNION {<<>>, FALSE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07642 failed.
    Attempted to compare boolean FALSE with non-boolean:
    <<>>
---*)
