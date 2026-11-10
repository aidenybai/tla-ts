(*---
description: Evaluates a random set expression, seed 262, number 8939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((-1) + Cardinality({})) .. CASE ({2, 1, 3} \subseteq Nat) -> Cardinality({2, 1, 3}) [] OTHER -> (CHOOSE b13864 \in {1, 2} : TRUE)), {LET b13866 == ([a |-> 1]).a IN Len(<<1, 2>>) : b13865 \in UNION {({2, 1, 3} \cup {2, 1, 3}), (SUBSET {1} \cup Nat)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08939 failed.
    Attempted to enumerate S \cup T when S:
    {{}, {1}}
    and T:
    Nat
    are not both enumerable
---*)
