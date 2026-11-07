(*---
description: Evaluates a random int expression, seed 262, number 1313.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01313 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (~((CHOOSE r \in [a : {1}] : TRUE) = SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) THEN (Len([<<1, 2>> EXCEPT ![1] = 2147483647]) - Head(Append(<<>>, 0))) ELSE Cardinality({([a |-> 1, b |-> TRUE]).a : b2093 \in (Nat \cap SUBSET {1})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01313 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<1, 2>>
---*)
