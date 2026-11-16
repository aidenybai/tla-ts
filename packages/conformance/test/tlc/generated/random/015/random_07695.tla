(*---
description: Evaluates a random seq expression, seed 262, number 7695.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07695 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((((1 :> 2))[2147483647] - Head(<<1>>)) % Append(Append([x \in Nat |-> x + 1], -1), (7 * 7))), IF ({b11852 \in {2, 1, 3} : TRUE} = (SUBSET {1} \ 2..1)) THEN ([<<5, 6>> EXCEPT ![2] = 1] @@ ([x \in Nat |-> x + 1])[2147483647]) ELSE LET b11853 == (3 % 0) IN (-2)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07695 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
