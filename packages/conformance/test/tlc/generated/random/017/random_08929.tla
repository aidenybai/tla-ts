(*---
description: Evaluates a random bool expression, seed 262, number 8929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ([a |-> 1] = (1 :> 2)) -> ([a |-> 1, b |-> TRUE])[3] [] OTHER -> Head(<<1>>) = Append(SubSeq(<<>>, -1, [a |-> 1]), (-2147483647))) \/ (\A b13844 \in ({b13845 : b13845 \in 1} \cap {b13846 \in SUBSET {1} : TRUE}) : ((b13844 .. 3) = (SUBSET {1} \ {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08929 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<2>>
---*)
