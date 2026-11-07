(*---
description: Evaluates a random function expression, seed 262, number 4107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(<<(3 * 2147483647), ([x \in 1..2 |-> x])[2]>>, CASE (FALSE => FALSE) -> Head(<<>>) [] OTHER -> (7 + (1 :> 2))) EXCEPT ![CASE ((~FALSE) \/ (TRUE \/ TRUE)) -> Len([<<1>> EXCEPT ![1] = -1]) [] OTHER -> ({b6452 \in SUBSET {1} : [a |-> 1]} @@ [[x \in Nat |-> x + 1] EXCEPT ![1] = 0])] = (IF (FALSE \/ FALSE) THEN (7 * 7) ELSE (CHOOSE b6453 \in {1} : FALSE) - ((-0) \div (--1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 392 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 389.
    | ExtendableExpr starting at line 14, column 379.
    | Expression starting at line 14, column 379.
    | ExtendableExpr starting at line 14, column 378.
    | ExtendableExpr starting at line 14, column 345.
    | Fatal errors while parsing TLA+ spec in file random_04107
    | In module random_04107
    | Could not parse module random_04107 from file random_04107.tla
    | *** Errors: 1
    | In module random_04107
    | Could not parse module random_04107 from file random_04107.tla
    3002:1 Parsing or semantic analysis failed.
---*)
