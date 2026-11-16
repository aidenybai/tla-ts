(*---
description: Evaluates a random function expression, seed 262, number 6552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(Append(<<1, 2>>, 2), LAMBDA p, q : p < q) @@ [b10069 \in DOMAIN (1 :> 2) |-> LET b10070 == b10069 IN 0]) @@ [[b10071 \in UNION {{}, Nat} |-> Head(<<>>)] EXCEPT ![Cardinality((1..3 \ {1, 2}))] = ([a |-> 2147483647, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06552 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
