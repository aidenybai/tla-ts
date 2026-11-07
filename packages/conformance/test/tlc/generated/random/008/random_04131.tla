(*---
description: Evaluates a random int expression, seed 262, number 4131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (({b6495 \in {1, 2} : FALSE} \cup {-1, 2147483647}) = (({} \cup SUBSET {1}) \cap ({2, 1, 3} \cap <<3, 1, 2>>))) -> LET b6496 == (LET b6497 == 2147483647 IN -1 % (7 + 3)) IN (({2, 1, 3} \cap {1, 2}) % Cardinality({})) [] OTHER -> ((LET b6498 == 0 IN b6498 * (3 + 1)) % (Head(<<1, 2>>) \div LET b6499 == -1 IN b6499)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04131 failed.
    Attempted to check set membership in a tuple value.
---*)
