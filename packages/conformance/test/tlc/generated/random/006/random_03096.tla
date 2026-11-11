(*---
description: Evaluates a random set expression, seed 262, number 3096.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03096 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((-1 * b4939) \div Cardinality(1..3)) * (CHOOSE b4940 \in ({1} \cup {}) : (TRUE <=> TRUE))) : b4939 \in DOMAIN [([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) EXCEPT ![(CHOOSE b4941 \in SUBSET {1} : TRUE)] = (-1 + -1)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03096 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
