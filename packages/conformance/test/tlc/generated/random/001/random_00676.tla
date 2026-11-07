(*---
description: Evaluates a random bool expression, seed 262, number 676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b1132 \in ({1, 2147483647} \ {b1133 \in {} : TRUE}) : ((2..1 \cup {2, 1, 3}) => ([x \in 1..2 |-> x] @@ <<5, 6>>))) => (((FALSE \ Nat) \subseteq DOMAIN 2) => (SortSeq(<<>>, LAMBDA p, q : p < q) => (3 = -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00676 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 76 to line 14, col 132 of module random_00676
---*)
