(*---
description: Evaluates a random function expression, seed 262, number 8298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (FALSE /\ FALSE) THEN (--1) ELSE (0 \div -1) % Len(<<0, 2147483647>>)) .. ([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (-[a |-> 1, b |-> TRUE])]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 46 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 43.
    | Expression starting at line 14, column 43.
    | IF THEN ELSE starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_08298
    | In module random_08298
    | Could not parse module random_08298 from file random_08298.tla
    | *** Errors: 1
    | In module random_08298
    | Could not parse module random_08298 from file random_08298.tla
    3002:1 Parsing or semantic analysis failed.
---*)
