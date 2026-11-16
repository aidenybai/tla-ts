(*---
description: Evaluates a random set expression, seed 262, number 6699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([b10269 \in {b10270 : b10270 \in 2..1} |-> (-b10269)])[Len(SortSeq(<<>>, LAMBDA p, q : p < q))], ((CHOOSE b10271 \in (SUBSET {1} \cap {}) : ({} = Nat)) \div Head(SortSeq(<<1>>, LAMBDA p, q : p < q)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06699 failed.
    In applying the function
    <<>>,
    the first argument is:
    0
    which is not in its domain.
---*)
