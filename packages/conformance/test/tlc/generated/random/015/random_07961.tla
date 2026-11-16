(*---
description: Evaluates a random function expression, seed 262, number 7961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b12286 \in (({1} \cap {x \in 1..3 : x > 1}) \cup (0 .. -1)) |-> (LET b12287 == 7 IN b12286 \div CASE FALSE -> 2147483647 [] OTHER -> 0)] EXCEPT ![([b12288 \in [<<1, 2>> EXCEPT ![1] = 0] |-> (--1)])[(CHOOSE b12289 \in {1, -1} : (FALSE <=> FALSE))]] = ([[[x \in Nat |-> x + 1] EXCEPT ![1] = 7] EXCEPT ![SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)] = (CHOOSE b12290 \in 1..3 : TRUE)])[(CASE TRUE -> -1 [] OTHER -> 3 \div Len(<<1, 2>>))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 211 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 208.
    | Expression starting at line 14, column 208.
    | Some [] Form starting at line 14, column 165.
    | ExtendableExpr starting at line 14, column 165.
    | Expression starting at line 14, column 165.
    | Fatal errors while parsing TLA+ spec in file random_07961
    | In module random_07961
    | Could not parse module random_07961 from file random_07961.tla
    | *** Errors: 1
    | In module random_07961
    | Could not parse module random_07961 from file random_07961.tla
    3002:1 Parsing or semantic analysis failed.
---*)
