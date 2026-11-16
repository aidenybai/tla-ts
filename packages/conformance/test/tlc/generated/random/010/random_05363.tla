(*---
description: Evaluates a random seq expression, seed 262, number 5363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq([<<1, 2>> EXCEPT ![1] = 7], LAMBDA e : e > 0), (((1 :> 2))[0] + (2 + <<>>))) EXCEPT ![1] = IF ((--1) \in ({1} \cup {2, 1, 3})) THEN (SortSeq(<<>>, LAMBDA p, q : p < q) - LET b8295 == 0 IN [x \in Nat |-> x + 1]) ELSE (Cardinality(1..3) + (2147483647 - 0))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 132 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 129.
    | Expression starting at line 14, column 129.
    | ExtendableExpr starting at line 14, column 128.
    | Expression starting at line 14, column 128.
    | IF THEN ELSE starting at line 14, column 125.
    | Fatal errors while parsing TLA+ spec in file random_05363
    | In module random_05363
    | Could not parse module random_05363 from file random_05363.tla
    | *** Errors: 1
    | In module random_05363
    | Could not parse module random_05363 from file random_05363.tla
    3002:1 Parsing or semantic analysis failed.
---*)
