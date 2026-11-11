(*---
description: Evaluates a random int expression, seed 262, number 4852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) + ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE))[LET b7566 == 7 IN 2..1]) \div (([[x \in 1..2 |-> x] EXCEPT ![1] = 2] @@ (CHOOSE f \in [{} -> 2..1] : TRUE)))[CASE (\E b7567 \in SUBSET {1} : TRUE) -> IF FALSE THEN 2147483647 ELSE 2 [] OTHER -> LET b7568 == 2147483647 IN 7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04852 failed.
    Attempted to check equality of integer 0 with non-integer:
    {}
---*)
