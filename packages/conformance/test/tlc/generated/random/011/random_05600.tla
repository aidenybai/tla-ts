(*---
description: Evaluates a random set expression, seed 262, number 5600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b8670 == ((2147483647 \div b8669) + Cardinality({2, 1, 3})) IN ([b8671 \in SUBSET {1} |-> b8670])[Head(<<1>>)] : b8669 \in ((CHOOSE b8672 \in ({1} \cup [x \in Nat |-> x + 1]) : SortSeq(<<>>, LAMBDA p, q : p < q)) .. ([a |-> 2147483647, b |-> FALSE] * (-1 + 3)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05600 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    [x \in Nat |-> <expression line 14, col 188 to line 14, col 192 of module random_05600>]
    are not both enumerable
---*)
