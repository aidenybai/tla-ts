(*---
description: Evaluates a random seq expression, seed 262, number 9413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = -1] @@ (3 :> -1)) @@ [(-1 :> 2147483647) EXCEPT ![(CHOOSE b14601 \in SUBSET {1} : TRUE)] = IF TRUE THEN 1 ELSE <<1, 2>>]) \o LET b14602 == LET b14603 == (2147483647 * 1) IN (-2147483647) IN ((3 :> b14602))[(b14602 - b14602)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09413 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
