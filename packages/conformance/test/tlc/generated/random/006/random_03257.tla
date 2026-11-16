(*---
description: Evaluates a random seq expression, seed 262, number 3257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append((SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) \o SubSeq(<<1, 2>>, -1, 2147483647)), ([b5184 \in {2, 1, 3} |-> 1])[([a |-> 1]).a]) \o Append(SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03257 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -1
---*)
