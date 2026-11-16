(*---
description: Evaluates a random function expression, seed 262, number 4654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((1 \div 1) :> (--1)) EXCEPT ![([a |-> 0, b |-> {2, 1, 3}]).a] = ((1 :> 1))[(1 % 2)]] EXCEPT ![((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE))[(CASE FALSE -> 0 [] OTHER -> -1 \div (3 * 2147483647))]] = (-(([x \in 1..2 |-> x] @@ <<5, 6>>) * Cardinality({})))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 36 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 33.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_04654
    | In module random_04654
    | Could not parse module random_04654 from file random_04654.tla
    | *** Errors: 1
    | In module random_04654
    | Could not parse module random_04654 from file random_04654.tla
    3002:1 Parsing or semantic analysis failed.
---*)
