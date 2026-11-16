(*---
description: Evaluates a random set expression, seed 262, number 2438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b3847 \in {x \in 1..3 : x > 1} : TRUE) % (--1)) % IF (FALSE /\ FALSE) THEN (3 * 2) ELSE (CHOOSE b3848 \in SUBSET {1} : FALSE)) .. {(([x \in Nat |-> x + 1])[2] \div Head(<<1, 2>>)), ([a |-> 1, b |-> [a |-> 1]]).a}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 71 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_02438
    | In module random_02438
    | Could not parse module random_02438 from file random_02438.tla
    | *** Errors: 1
    | In module random_02438
    | Could not parse module random_02438 from file random_02438.tla
    3002:1 Parsing or semantic analysis failed.
---*)
