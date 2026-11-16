(*---
description: Evaluates a random int expression, seed 262, number 7578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11662 \in (([b11663 \in 2..1 |-> b11663])[{2, 0}] * ((-1 - 7) - (CHOOSE b11664 \in SUBSET {1} : FALSE))) : (({b11665 \in SUBSET {1} : FALSE} \cup {b11666 \in {1, 2} : TRUE}) = (DOMAIN <<5, 6>> \cup ({x \in 1..3 : x > 1} \cup {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07578 failed.
    In applying the function
    <<>>,
    the first argument is:
    {0, 2}
    which is not in its domain.
---*)
