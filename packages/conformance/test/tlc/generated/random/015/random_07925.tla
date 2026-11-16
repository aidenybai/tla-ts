(*---
description: Evaluates a random set expression, seed 262, number 7925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12236 \in (({7 : b12237 \in {1}} \cup {b12238 \in SUBSET {1} : TRUE}) \cap (UNION {{1, 2}, {1}} \cap UNION {{1, 2}, Nat})) : (SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) = [b12239 \in (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE) |-> (b12239 % 2147483647)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07925 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2}
---*)
