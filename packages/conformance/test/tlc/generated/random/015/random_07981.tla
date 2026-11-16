(*---
description: Evaluates a random set expression, seed 262, number 7981.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07981 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((3 .. 7) \subseteq {b12326 \in {} : TRUE}) THEN ((CHOOSE r \in [a : {}] : TRUE)).a ELSE (CASE TRUE -> 1 [] OTHER -> 1 - Cardinality(1..3)) \ {((CHOOSE b12328 \in 1..3 : TRUE) * (b12327 \div 7)) : b12327 \in ((Nat \cup {2, 1, 3}) \cap {b12329 \in {} : <<5, 6>>})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07981 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    1
    is not enumerable.
---*)
