(*---
description: Evaluates a random function expression, seed 262, number 8352.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08352 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({2, -1}) :> (-(2147483647 + 3))) @@ ((CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE) @@ [[<<5, 6>> EXCEPT ![3] = -1] EXCEPT ![(--1)] = LET b12926 == (1 :> 2) IN 2147483647])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 153 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 150.
    | Expression starting at line 14, column 150.
    | Except Component starting at line 14, column 149.
    | Except Spec starting at line 14, column 148.
    | Some [] Form starting at line 14, column 112.
    | Fatal errors while parsing TLA+ spec in file random_08352
    | In module random_08352
    | Could not parse module random_08352 from file random_08352.tla
    | *** Errors: 1
    | In module random_08352
    | Could not parse module random_08352 from file random_08352.tla
    3002:1 Parsing or semantic analysis failed.
---*)
