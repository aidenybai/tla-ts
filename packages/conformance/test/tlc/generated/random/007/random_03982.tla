(*---
description: Evaluates a random bool expression, seed 262, number 3982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6259 \in {[SubSeq(<<1, 2>>, 1, 2147483647) EXCEPT ![Cardinality(SUBSET {1})] = (3 % 0)] : b6260 \in {b6261 \in {-1, [a |-> 1, b |-> TRUE]} : (~TRUE)}} : [[[a |-> 1, b |-> {}] EXCEPT !.a = @ + CASE FALSE -> 0 [] OTHER -> 7] EXCEPT !.a = SubSeq({0 : b6262 \in SUBSET {1}}, Append(<<3, 1, 2>>, 2), LET b6263 == <<1, 2>> IN b6263)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03982 failed.
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    -1
---*)
