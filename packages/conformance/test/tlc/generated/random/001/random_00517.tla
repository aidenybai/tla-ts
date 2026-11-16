(*---
description: Evaluates a random set expression, seed 262, number 517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-((1 :> 2))[2]) - {b873 \in (Nat \cap Nat) : (b873 < b873)}), (((CHOOSE b874 \in 7 : TRUE) * ([a |-> 1, b |-> TRUE]).a) - ((1 + <<5, 6>>) \div (--1)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 165 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 162.
    | ExtendableExpr starting at line 14, column 142.
    | Expression starting at line 14, column 142.
    | ExtendableExpr starting at line 14, column 141.
    | ExtendableExpr starting at line 14, column 82.
    | Fatal errors while parsing TLA+ spec in file random_00517
    | In module random_00517
    | Could not parse module random_00517 from file random_00517.tla
    | *** Errors: 1
    | In module random_00517
    | Could not parse module random_00517 from file random_00517.tla
    3002:1 Parsing or semantic analysis failed.
---*)
