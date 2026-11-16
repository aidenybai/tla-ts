(*---
description: Evaluates a random seq expression, seed 262, number 4505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(((Append(<<1, 2>>, -1) \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) \o ([<<1>> EXCEPT ![1] = -1] \o Append(<<1, 2>>, 2))), Len(SelectSeq([<<>> EXCEPT ![1] = 3], LAMBDA e : e > 0)), (\A b7080 \in DOMAIN (<<5, 6>> @@ <<5, 6>>) : (({1, 2} \subseteq SUBSET {1}) \/ (<<1, 2>> = [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 162 to line 14, col 165 of module random_04505
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04505 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
