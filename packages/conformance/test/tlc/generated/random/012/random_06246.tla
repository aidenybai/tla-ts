(*---
description: Evaluates a random set expression, seed 262, number 6246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<(CHOOSE r \in [a : 2..1] : TRUE), Cardinality({1})>> \o (Tail(<<1, 2>>) \o Append(<<1>>, -1))) \cup (UNION {[[a |-> 1] EXCEPT !.a = @ + TRUE], {b9618 \in {1, 2} : TRUE}} \cup {b9619 \in UNION {{}, SUBSET {1}} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06246 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 50 of module random_06246
---*)
