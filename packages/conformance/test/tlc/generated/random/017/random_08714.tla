(*---
description: Evaluates a random set expression, seed 262, number 8714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b13495 \in DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) : ((b13495 % b13495) = [[a |-> 1] EXCEPT !.a = @ + b13495])), [SortSeq(SubSeq(<<1, 2>>, 3, 2147483647), LAMBDA p, q : p < q) EXCEPT ![1] = Head(Tail(<<3, 1, 2>>))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08714 failed.
    Attempted to check equality of integer 0 with non-integer:
    [a |-> 3]
---*)
