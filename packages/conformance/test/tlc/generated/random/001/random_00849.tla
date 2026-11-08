(*---
description: Evaluates a random function expression, seed 262, number 849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1386 \in (Len(SortSeq(<<>>, LAMBDA p, q : p < q)) :> (Head(<<1, 2>>) - (7 + 2147483647))) |-> CASE ((CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE) /\ ({1} \subseteq SUBSET {1})) -> Len(SortSeq([a |-> 1, b |-> TRUE], LAMBDA p, q : p < q)) [] OTHER -> Head(Append(<<1>>, b1386))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00849 failed.
    2178:0 Overflow when computing 7+2147483647
---*)
