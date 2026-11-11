(*---
description: Evaluates a random function expression, seed 262, number 553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-IF ({2, 1, 3} \in {2, 1, 3}) THEN (--1) ELSE (-0)) :> (((CHOOSE f \in [{} -> 2..1] : TRUE) @@ [<<5, 6>> EXCEPT ![1] = 3]))[CASE (TRUE => TRUE) -> ([x \in 1..2 |-> x])[2] [] OTHER -> CASE FALSE -> 7 [] OTHER -> 7]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 56 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 53.
    | Expression starting at line 14, column 53.
    | IF THEN ELSE starting at line 14, column 19.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_00553
    | In module random_00553
    | Could not parse module random_00553 from file random_00553.tla
    | *** Errors: 1
    | In module random_00553
    | Could not parse module random_00553 from file random_00553.tla
    3002:1 Parsing or semantic analysis failed.
---*)
